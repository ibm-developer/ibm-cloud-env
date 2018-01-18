const Log4js = require("log4js");
const fs = require("fs");
const _ = require("underscore");
const jsonpath = require('jsonpath');
const DEFAULT_LOG_LEVEL = Log4js.levels.INFO;
const PREFIX_PATTERN_FILE = "file";
const PREFIX_PATTERN_CF = "cloudfoundry";
const PREFIX_PATTERN_ENV = "env";

const loadedFiles = []; // keep track so we don't re-read the filesystem unnecessarily
const loadedMappings = {};

function IBMCloudEnv() {
	const logger = Log4js.getLogger("ibm-cloud-env");
	logger.setLevel(DEFAULT_LOG_LEVEL);

	function init(mappingsFilePath) {
		logger.trace("init", mappingsFilePath);
		mappingsFilePath = mappingsFilePath || "/server/config/mappings.json";
		mappingsFilePath = process.cwd() + mappingsFilePath;

		if (loadedFiles.includes(mappingsFilePath)) {
			logger.trace("already loaded", mappingsFilePath);
			return;
		}
		
		// we don't care if it fails or not, we just don't bother
		// retrying either way, so we put it in the array:
		loadedFiles.push(mappingsFilePath);
		
		logger.info("Initializing with", mappingsFilePath);
		if (!fs.existsSync(mappingsFilePath)) {
			logger.warn("File does not exist", mappingsFilePath);
			return;
		}

		let mappingsJson = JSON.parse(fs.readFileSync(mappingsFilePath, "UTF8"));
		let version = mappingsJson.version;
		delete mappingsJson.version;
		if (version === 1) {
			_.each(mappingsJson, function (value, key) {
				processMapping(key, value);
			});
		} else if (version === 2) {
			_.each(mappingsJson, function (value, key) {
				processMappingV2(key, value);
			});
		} else {
			// default to version 1 if not version can be found
			_.each(mappingsJson, function (value, key) {
				processMapping(key, value);
			});
		}
	}

	function processMapping(mappingName, config) {
		logger.trace("processMapping", mappingName, config);

		if (!config.searchPatterns || config.searchPatterns.length === 0) {
			logger.warn("No searchPatterns found for mapping", mappingName);
			return;
		}
		config.searchPatterns.every(function (searchPattern) {
			logger.debug("mapping name", mappingName, "search pattern", searchPattern);
			let value = processSearchPattern(mappingName, searchPattern);
			if (value) {
				loadedMappings[mappingName] = (_.isObject(value)) ? JSON.stringify(value) : value;
				return false;
			} else {
				return true;
			}
		});

		logger.debug(mappingName, "=", loadedMappings[mappingName]);
	}

	function processMappingV2(mappingName, config) {
		logger.trace("processMappingV2", mappingName, config);

		let keys = Object.keys(config);

		for (let i = 0; i < keys.length; i++) {
			let key = keys[i];

			if (!config[key].searchPatterns || config[key].searchPatterns.length === 0) {
				logger.warn(`No searchPatterns found for mapping ${mappingName}[${key}]`);
				return;
			}

			config[key].searchPatterns.every(function (searchPattern) {
				logger.debug(`mapping ${mappingName}[${key}] with seachPatterns ${searchPattern}`);
				let value = processSearchPattern(`${mappingName}[${key}]`, searchPattern);
				if (value) {
					loadedMappings[mappingName] = loadedMappings[mappingName] || {};
					loadedMappings[mappingName][key] = (_.isObject(value)) ? JSON.stringify(value) : value;
					return false;
				} else {
					return true;
				}
			});

			logger.debug(mappingName, "=", loadedMappings[mappingName]);

		}
	}

	function processSearchPattern(mappingName, searchPattern) {
		logger.trace("processSearchPattern", mappingName, searchPattern);
		let patternComponents = searchPattern.split(":");
		let value = null;

		switch (patternComponents[0]) {
			case PREFIX_PATTERN_FILE:
				value = processFileSearchPattern(patternComponents);
				break;
			case PREFIX_PATTERN_CF:
				value = processCFSearchPattern(patternComponents);
				break;
			case PREFIX_PATTERN_ENV:
				value = processEnvSearchPattern(patternComponents);
				break;
			default:
				logger.warn("Unknown searchPattern prefix", patternComponents[0], "Supported prefixes: cloudfoundry, env, file");
		}

		return value;
	}

	function processFileSearchPattern(patternComponents) {
		logger.trace("processFileSearchPattern", patternComponents);
		let filePath = process.cwd() + patternComponents[1];
		if (!fs.existsSync(filePath)) {
			logger.error("File does not exist", filePath);
			return;
		}

		let fileContent = fs.readFileSync(filePath, "UTF8");
		if (patternComponents.length == 3) {
			return processJSONPath(fileContent, patternComponents[2]);
		} else {
			return fileContent;
		}
	}

	function processCFSearchPattern(patternComponents) {
		logger.trace("processCFSearchPattern", patternComponents);
		let vcapServicesString = process.env.VCAP_SERVICES;
		let vcapApplicationString = process.env.VCAP_APPLICATION;
		if (_.isUndefined(vcapServicesString) || _.isUndefined(vcapApplicationString)) {
			return;
		}
		if (patternComponents[1][0] === "$") {
			// patternComponents[1] is a JSONPath, try to get it from VCAP_SERVICES and VCAP_APPLICATION
			let value = processJSONPath(vcapServicesString, patternComponents[1]);
			if (!_.isUndefined(value)) {
				return value;
			} else {
				return processJSONPath(vcapApplicationString, patternComponents[1]);
			}
		} else {
			// patternComponents[1] is a service instance name, find it in VCAP_SERVIES and return credentials object
			let jsonPath = '$..[?(@.name=="' + patternComponents[1] + '")].credentials';
			return processJSONPath(vcapServicesString, jsonPath);
		}
	}

	function processEnvSearchPattern(patternComponents) {
		logger.trace("processEnvSearchPattern", patternComponents);
		let value = process.env[patternComponents[1]];
		if (value && patternComponents.length === 3) {
			value = processJSONPath(value, patternComponents[2]);
		}
		return value;
	}

	function processJSONPath(jsonString, jsonPath) {
		logger.trace("processJSONPath", jsonString, jsonPath);
		try {
			let jsonObj = JSON.parse(jsonString);
			return jsonpath.value(jsonObj, jsonPath);
		} catch (e) {
			logger.debug(e);
			logger.error("Failed to apply JSONPath", jsonString, jsonPath);
		}
	}

	function setLogLevel(level) {
		logger.setLevel(level);
	}

	function getString(name) {
		return loadedMappings[name];
	}

	function getDictionary(name) {
		let value = getString(name);
		try {
			return JSON.parse(value);
		} catch (e) {
			if (typeof(value) === 'object') {
				return value;
			}
			return {
				value: value
			}
		}
	}

	return {
		init: init,
		getString: getString,
		getDictionary: getDictionary,
		setLogLevel: setLogLevel
	};
}

module.exports = IBMCloudEnv();
