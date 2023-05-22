## About

Github Action to update the setting of an [Spheron](https://spheron.network/) cluster instance.

---

- [Usage](#usage)
- [Instance Update Action](#instance-update-action)
  - [Inputs](#inputs)
  - [Outputs](#outputs)

## Usage

In the examples below we are going to see how we can create a Github workflow which will:

1. get the version of the project from `package.json`.
2. create a new docker image, which uses the version of the project for the image tag.
3. push the newly created image to the docker hub.
4. update the spheron instance to use the newly created image.

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
        uses: spheronFdn/instance-update-action@v1.0
        with:
          spheron-token: ${{ secrets.SPHERON_TOKEN }}
          instance-id: ${{ secrets.SPHERON_INSTANCE_ID }}
          tag: ${{ steps.extract-version.outputs.version }}
          env: "key1=value1,key2=value2"
          secret-env: "skey1=s1,skey2=s2"
```

In the examples we are also using 4 other actions:

- [actions/checkout](https://github.com/actions/checkout) action will checkout the repository.
- [docker/login-action](https://github.com/docker/login-action) action will login to the Docker registry so it's possible to push the image.
- [docker/setup-buildx-action](https://github.com/docker/setup-buildx-action) action will setup the Docker Buildx.
- [docker/build-push-action](https://github.com/docker/build-push-action) action will build and push the image to the Docker registry.

## Instance Update Action

### Inputs

- **spheron-token**: To create the `token`, follow the instructions in the [DOCS](https://docs.spheron.network/rest-api/#creating-an-access-token). When you are creating the tokens, please choose **Compute** type in the dashboard.
- **instance-id**: The ID of the instance that should be updated.
- **tag( optional )**: The tag that will be used to update the instance. If the tag is not provided, `latest` will be used.
- **env( optional )**: The environment variables that should be used. The environment variables need to be provided each time the instance is updated. You will be able to see the value of the environment variables in the settings page of your instance.
- **secret-env( optional )**: The secret environment variables that should be used. The secret environment variables need to be provided each time the instance is updated. You will not be able to see the value of the environment variables in the settings page of your instance.

### Outputs

- **cluster-id**: The Cluster ID of the updated instance.
- **instance-id**: The ID of the updated instance.
- **order-id**: The Order ID of the updated instance.
- **organization-id**: The Organization Id of the updated instance.
