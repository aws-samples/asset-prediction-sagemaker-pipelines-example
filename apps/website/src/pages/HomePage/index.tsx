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

import { FunctionComponent } from 'react'
import { Box, Container, Link } from 'aws-northstar'
import { useAuthContext } from '../../contexts/AuthenticatedUserContext'

const HomePage: FunctionComponent = () => {
  const authContext = useAuthContext()

  return (
    <>
      <Container headingVariant='h1' title='Asset Prediction Sagemaker Pipelines Example'>
        <Container headingVariant='h2' title='End to end flow'>
          <Box style={{ fontSize: 16, paddingLeft: 10 }}>
            <ol style={{ lineHeight: 2 }}>
              <li>
                Create asset entries and upload CSVs (or use the&nbsp;
                <Link href='https://github.com/aws-samples/asset-prediction-sagemaker-pipelines-example/tree/main/apps/asset-import'>
                  asset import tool
                </Link>
                )
              </li>
              <li>Create a model training template and set all the parameters</li>
              <li>Create a model training execution and select the template to use</li>
              <li>
                Trigger model training with the <code>Start model training</code> button
              </li>
              <li>
                <i>
                  Lambda function will call <code>startPipelineExecution</code> with the right parameters
                </i>
              </li>
              <li>
                <i>Processing step performs the feature engineering step, stores features/test/training data in S3</i>
              </li>
              <li>
                <i>Training step trains the model</i>
              </li>
              <li>
                <i>Model gets created and registered with Sagemaker</i>
              </li>
              <li>
                Create model endpoint (and config) from the UI using the <code>Create endpoint</code> button
              </li>
              <li>Run inference against the trained model with parameters set on the UI</li>
              <li>Analyze output from inference on a chart in the UI</li>
              <li>
                Delete model endpoint manually or leave it{' '}
                <i>and it will be automatically cleaned up after 60 minutes</i>
              </li>
            </ol>
          </Box>
        </Container>
        <Container headingVariant='h3' title='Remarks'>
          <Box style={{ fontSize: 18 }}>
            <p>
              This project has been created by the ASEAN Prototyping Team&nbsp;&nbsp;|&nbsp;&nbsp;
              <Link href='https://github.com/aws-samples/asset-prediction-sagemaker-pipelines-example'>Code</Link>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <Link href='https://github.com/aws-samples/asset-prediction-sagemaker-pipelines-example/issues'>
                Issues
              </Link>
            </p>
          </Box>

          <Box style={{ fontFamily: 'monospace' }}>
            <p>Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.</p>
            <p>
              Permission is hereby granted, free of charge, to any person obtaining a copy of
              <br />
              this software and associated documentation files (the "Software"), to deal in
              <br />
              the Software without restriction, including without limitation the rights to
              <br />
              use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
              <br />
              the Software, and to permit persons to whom the Software is furnished to do so.
              <br />
            </p>
            <p>
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
              <br />
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
              <br />
              FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
              <br />
              COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
              <br />
              IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
              <br />
              CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
              <br />
            </p>
          </Box>
        </Container>
      </Container>
    </>
  )
}

export default HomePage
