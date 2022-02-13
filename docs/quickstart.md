# Quickstart guide

## Deployment

1. Create an AWS Profile on your development machine to deploy this project (e.g.: `my-deployment-profile`)
1. Navigate to `apps/infra/config`
   1. Copy the `default-XXXXXXXXXXXX.json` file to a new file where `XXXXXXXXXXXX` is your AWS ACCOUNT ID
   1. Replace the config settings to your own values. Mandatory changes to `account`, `administratorEmail` fields
1. Navigate to the root of the project and edit the variables of `one-click-deploy.sh`.

   > IMPORTANT: Make sure the `namespace` values match in `infra/config` and in the `one-click-deploy` script

1. Make sure you have all the required tools installed on your dev machine (*tested on mac*).

1. Then run the deployment script
   
   ```sh
   ./one-click-deploy.sh
   ```

---

## Asset import

1. Open `apps/asset-import/config/default.json` and update the necessary variables (check `default-example.json`)
   * profile = `DEPLOYMENT_PROFILE`
   * bucket = `<NAMESPACE>-assets-<ACCOUNT_ID>-<REGION>`
   * assetsDDBTableName = `<NAMESPACE>-asset-metadata`

1. Download assets 

1. Run the script in `apps/asset-import`:

   ```sh
   yarn install
   yarn importcsvs
   ```

## Local web ui development

1. Open and update variables in `prototype/scripts/pull-appvariables-js.sh`
1. Run it
1. Navigate to `prototype/website`
1. Run `yarn start`