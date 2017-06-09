process.env.VCAP_SERVICES = JSON.stringify({
	"service1": [
		{
			name: "service1-name1",
			credentials: {
				username: "service1-username1",
			}
		},
		{
			name: "service1-name2",
			credentials: {
				username: "service1-username2",
			}
		}
	],
	"user-provided": [
		{
			name: "service2-name1",
			credentials:{
				username: "service2-username1"
			}
		}
	]
});

process.env.VCAP_APPLICATION = JSON.stringify({
	"application_name": "test-application"
});

process.env.ENV_VAR_STRING = "test-12345";
process.env.ENV_VAR_JSON = JSON.stringify({
	credentials: {
		username: "env-var-json-username"
	}
});

