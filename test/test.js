/*
 * © Copyright IBM Corp. 2017, 2018
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const expect = require('chai').expect;
const Log4js = require('log4js');

describe('App', function () {
	let IBMCloudEnv;

	before(function () {
		require("./fake-env-vars");
		IBMCloudEnv = require("../lib/lib.js");
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
