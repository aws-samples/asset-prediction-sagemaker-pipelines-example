/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                               *
 *                                                                                                                   *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of                                  *
 *  this software and associated documentation files (the "Software"), to deal in                                    *
 *  the Software without restriction, including without limitation the rights to                                     *
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of                                 *
 *  the Software, and to permit persons to whom the Software is furnished to do so.                                  *
 *                                                                                                                   *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR                                       *
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS                                 *
 *  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR                                   *
 *  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER                                   *
 *  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN                                          *
 *  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.                                       *
 *********************************************************************************************************************/

import { ComponentType, FunctionComponent } from 'react'
import { NorthStarThemeProvider } from 'aws-northstar'
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import { withAuthenticator } from '@aws-amplify/ui-react'
import { AssetRouter } from '../../pages/Asset/router'
import { TrainingTemplateRouter } from '../../pages/TrainingTemplate/router'
import { ModelTrainingExecutionRouter } from '../../pages/ModelTrainingExecution/router'
import { AuthenticatedUserContextProvider } from '../../contexts/AuthenticatedUserContext'
import { appvars } from '../../config'
import AppLayout from '../AppLayout'
import HomePage from '../../pages/HomePage'
import './AppRoot.css'
import { ModelPredictionRouter } from '../../pages/ModelPrediction/router'

const withLayout =
  (Component: ComponentType): FunctionComponent =>
  (props) =>
    (
      <AppLayout>
        <Component {...props} />
      </AppLayout>
    )

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const AppRoot = () => {
  return (
    <NorthStarThemeProvider>
      <AuthenticatedUserContextProvider>
        <Router>
          <Switch>
            <Route path={`/${appvars.URL.ASSET}`} component={withLayout(AssetRouter)} />
            <Route path={`/${appvars.URL.TRAINING_TEMPLATE}`} component={withLayout(TrainingTemplateRouter)} />
            <Route
              path={`/${appvars.URL.MODEL_TRAINING_EXECUTION}`}
              component={withLayout(ModelTrainingExecutionRouter)}
            />
            <Route path={`/${appvars.URL.MODEL_PREDICTION}`} component={withLayout(ModelPredictionRouter)} />
            <Route exact path='/' component={withLayout(HomePage)} />
          </Switch>
        </Router>
      </AuthenticatedUserContextProvider>
    </NorthStarThemeProvider>
  )
}

export default withAuthenticator(AppRoot)
