const core = require("@actions/core");
const httpm = require("@actions/http-client");
const auth = require("@actions/http-client/lib/auth");
const uuid = require("uuid");

const mapVariables = (variables, isSecret) => {
  // variables format ["key1=value1", "key2=value2"]
  const variablesArray = JSON.parse(variables);
  return variablesArray.map((variable) => ({
    value: variable,
    isSecret,
  }));
};

const main = async () => {
  try {
    // inputs
    const token = core.getInput("spheron-token");
    const instanceId = core.getInput("instance-id");
    const tag = core.getInput("tag");
    const inputVariables = core.getInput("env");
    const secretInputVariables = core.getInput("secret-env");

    const bearerToken = new auth.BearerCredentialHandler(token);
    const http = new httpm.HttpClient("http", [bearerToken]);

    const tokenScopeResponse = await http.get(
      "https://api-v2.spheron.network/v1/api-keys/scope"
    );

    const scope = JSON.parse(await tokenScopeResponse.readBody());
    if (scope.error) {
      core.setFailed(scope.message);
      return;
    }

    const organizationId = scope.organizations[0].id;

    const updateRequestBody = {
      env: [
        ...mapVariables(inputVariables, false),
        ...mapVariables(secretInputVariables, true),
      ],
      uniqueTopicId: uuid.v4(),
      organizationId,
      tag,
    };

    console.time("Done: ");
    const updateResponse = await http.patchJson(
      `https://api-v2.spheron.network/v1/cluster-instance/${instanceId}/update`,
      updateRequestBody
    );

    if (!updateResponse.result.success || updateResponse.result.error) {
      core.setFailed(scope.message);
      return;
    }

    const clusterId = updateResponse.result.clusterId;
    const orderId = updateResponse.result.clusterInstanceOrderId;
    const message = updateResponse.result.message;

    console.log("Update instance triggered successfully!");
    console.timeEnd("Done: ");
    console.log(`Status: ${message}`);
    console.log("Checkout the logs at:");
    console.log(
      `https://app.spheron.network/#/compute/org/${organizationId}/cluster/${clusterId}/instance/${orderId}/logs`
    );

    core.setOutput("cluster-id", clusterId);
    core.setOutput("instance-id", instanceId);
    core.setOutput("order-id", orderId);
    core.setOutput("organization-id", organizationId);
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
