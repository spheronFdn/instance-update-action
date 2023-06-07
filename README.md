## About

Github Action and  Circle CI configuration to update the setting of an [Spheron](https://spheron.network/) cluster instance.

---

- [About](#about)
- [Usage](#usage)
- [Instance Update Action](#instance-update-action)
  - [Inputs](#inputs)
  - [Outputs](#outputs)
  - [CircleCI Configuration](#circleci-configuration)

## Usage

In the examples below we are going to see how we can create a Github workflow and a CircleCI configuration which will:

1. get the version of the project from `package.json`.
2. create a new docker image, which uses the version of the project for the image tag.
3. push the newly created image to the docker hub.
4. update the spheron instance to use the newly created image.
*GitHub Actions*
```yaml
name: Update Spheron Cluster Instance

on:
  push:
    branches:
      - main

jobs:
  update-spheron-instance:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        id: checkout-repository
        uses: actions/checkout@v3

      - name: Extract version
        id: extract-version
        run: echo "version=$(cat package.json | jq -r '.version')" >> "$GITHUB_OUTPUT"

      - name: Login to Docker Hub
        id: docker-hub-login
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Set up Docker Buildx
        id: docker-buildx-setup
        uses: docker/setup-buildx-action@v2

      - name: Build and push
        id: docker-build-n-push
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: image:${{ steps.extract-version.outputs.version }}

      - name: Update Spheron Instance
        id: update-spheron-instance
        uses: spheronFdn/instance-update-action@v1.0.2
        with:
          spheron-token: ${{ secrets.SPHERON_TOKEN }}
          instance-id: ${{ secrets.SPHERON_INSTANCE_ID }}
          tag: ${{ steps.extract-version.outputs.version }}
          env: '[ "key1=value1", "key2=value2" ]'
          secret-env: '[ "skey1=svalue1", "skey2=svalue2" ]'
```

CircleCI Configuration
The CircleCI configuration file .circleci/config.yml can be used to achieve a similar workflow:
```yaml
version: 2.1
orbs:
  node: circleci/node@5.1.0
jobs:
  update_spheron_instance:
    docker:
      - image: circleci/node:16
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Update Spheron instance
          command: node index.js
workflows:
  version: 2
  update-spheron-instance:
    jobs:
      - update_spheron_instance

```
Please ensure you replace the placeholders (SPHERON_TOKEN, INSTANCE_ID, TAG, ENV, SECRET_ENV) in both the GitHub Actions and CircleCI configurations with your actual values.
In the examples we are also using 4 other actions:
For the Github Actions:
- [actions/checkout](https://github.com/actions/checkout) action will checkout the repository.
- [docker/login-action](https://github.com/docker/login-action) action will login to the Docker registry so it's possible to push the image.
- [docker/setup-buildx-action](https://github.com/docker/setup-buildx-action) action will setup the Docker Buildx.
- [docker/build-push-action](https://github.com/docker/build-push-action) action will build and push the image to the Docker registry.

## Instance Update Action

### Inputs

- **spheron-token**: To create the `token`, follow the instructions in the [DOCS](https://docs.spheron.network/rest-api/#creating-an-access-token). When you are creating the tokens, please choose **Compute** type in the dashboard.
- **instance-id**: The ID of the instance that should be updated.
- **tag( optional )**: The tag that will be used to update the instance. If the tag is not provided, `latest` will be used.
- **env( optional )**: The environment variables that should be used. The environment variables need to be provided each time the instance is updated. You will be able to see the value of the environment variables in the settings page of your instance. The value of env is an string that represents an json array where each element in the array is string in format `key=value`.
- **secret-env( optional )**: The secret environment variables that should be used. The secret environment variables need to be provided each time the instance is updated. You will not be able to see the value of the environment variables in the settings page of your instance. The value of secret env is an string that represents an json array where each element in the array is a string in format `key=value`.

### Outputs

- **cluster-id**: The Cluster ID of the updated instance.
- **instance-id**: The ID of the updated instance.
- **deployment-id**: The Deployment ID of the updated instance.
- **organization-id**: The Organization ID of the updated instance.

### CircleCI Configuration

The CircleCI configuration provided in this repository allows you to trigger a Spheron instance update each time a CircleCI workflow is run. This is done via the provided update_spheron_instance job in the .circleci/config.yml file. The command step in this job runs the index.js script which executes the update.

Please ensure you replace the placeholders (SPHERON_TOKEN, INSTANCE_ID, TAG, ENV, SECRET_ENV) in the CircleCI configuration with your actual values.
