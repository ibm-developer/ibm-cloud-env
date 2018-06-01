const expect = require('chai').expect;
const Log4js = require('log4js');
const IBMCloudEnv = require("../lib/lib.js");



describe('App', function () {

	before(function () {
		require("./fake-env-vars");
		IBMCloudEnv.setLogLevel(Log4js.levels.TRACE);
		IBMCloudEnv.init("/invalid-file-name");
		IBMCloudEnv.init();
	});

	it('Should be able to read plain text file', function () {
		expect(IBMCloudEnv.getString("file_var1")).to.equal("plain-text-string");
		expect(IBMCloudEnv.getDictionary("file_var1")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("file_var1")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("file_var1").value).to.equal("plain-text-string");
	});

	it('Should be able to read json file with JSONPath', function () {
		expect(IBMCloudEnv.getString("file_var2")).to.equal(JSON.stringify({level2: 12345}));
		expect(IBMCloudEnv.getDictionary("file_var2")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("file_var2")).to.have.a.property("level2");
		expect(IBMCloudEnv.getDictionary("file_var2").level2).to.equal(12345);
	});

	it('Should be able to read CF service credentials via service instance name', function () {
		expect(IBMCloudEnv.getString("cf_var1")).to.equal(JSON.stringify({username: "service1-username1"}));
		expect(IBMCloudEnv.getDictionary("cf_var1")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("cf_var1")).to.have.a.property("username");
		expect(IBMCloudEnv.getDictionary("cf_var1").username).to.equal("service1-username1");
	});

	it('Should be able to read VCAP_SERVICES and VCAP_APPLICATION with JSONPath', function () {
		expect(IBMCloudEnv.getString("cf_var2")).to.equal("service1-username1");
		expect(IBMCloudEnv.getDictionary("cf_var2")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("cf_var2")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("cf_var2").value).to.equal("service1-username1");

		expect(IBMCloudEnv.getString("cf_var3")).to.equal("test-application");
		expect(IBMCloudEnv.getDictionary("cf_var3")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("cf_var3")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("cf_var3").value).to.equal("test-application");
		
		expect(IBMCloudEnv.getString("cf_var4")).to.equal("service1-username1");
		expect(IBMCloudEnv.getDictionary("cf_var4")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("cf_var4")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("cf_var4").value).to.equal("service1-username1");
	});

	it('Should be able to get simple string from environment var', function () {
		expect(IBMCloudEnv.getString("env_var1")).to.equal("test-12345");
		expect(IBMCloudEnv.getDictionary("env_var1")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("env_var1")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("env_var1").value).to.equal("test-12345");
	});

	it('Should be able to get stringified JSON dictionary from environment var', function () {
		expect(IBMCloudEnv.getString("env_var2")).to.equal(JSON.stringify({credentials: {username: "env-var-json-username"}}));
		expect(IBMCloudEnv.getDictionary("env_var2")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("env_var2")).to.have.a.property("credentials");
		expect(IBMCloudEnv.getDictionary("env_var2").credentials).to.have.a.property("username");
		expect(IBMCloudEnv.getDictionary("env_var2").credentials.username).to.equal("env-var-json-username");
	});

	it('Should be able to get stringified JSON dictionary from environment var and run JSONPath', function () {
		expect(IBMCloudEnv.getString("env_var3")).to.equal("env-var-json-username");
		expect(IBMCloudEnv.getDictionary("env_var3")).to.be.an("object");
		expect(IBMCloudEnv.getDictionary("env_var3")).to.have.a.property("value");
		expect(IBMCloudEnv.getDictionary("env_var3").value).to.equal("env-var-json-username");
	});
});

describe('Test credentials for Watson', function() {
	const credentials = {
		tag_label_creds: 'someOtherCreds',
		watson_discovery_password: 'password',
		watson_conversation_password: 'password',
		watson_conversation_url: 'url',
		watson_conversation_username: 'username',
		watson_conversation_api_key: 'api_key',
		watson_conversation_apikey: 'apikey',
	};
	const filtered_credentials = {
		'api_key': 'api_key',
		'iam_apikey': 'apikey',
		'password': 'password',
		'url': 'url',
		'username': 'username',
	};

	it('should return {} for missing parameters', function() {
		expect(IBMCloudEnv.getCredentialsForService('', '', null)).to.deep.equal({});
		expect(IBMCloudEnv.getCredentialsForService('', '', {})).to.deep.equal({});
		expect(IBMCloudEnv.getCredentialsForService('', '', undefined)).to.deep.equal({});
	});

	it('should return the credentials', function() {
		expect(IBMCloudEnv.getCredentialsForService('watson', 'conversation', credentials)).to.deep.equal(filtered_credentials);
	});

});
