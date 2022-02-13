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

import Amplify, { Auth as AmplifyAuth, API as AmplifyAPI } from 'aws-amplify'
import { appvars } from '../../config'

const {
  BACKENDVARS: { REGION, USERPOOL_ID, USERPOOL_CLIENT_ID, API_URL, API_PREFIX, API_DS_NAME },
} = appvars

// :: ---

const Auth = {
  region: REGION,
  userPoolId: USERPOOL_ID,
  userPoolWebClientId: USERPOOL_CLIENT_ID,
}

const endpoint = (API_URL as string).endsWith('/') ? `${API_URL}${API_PREFIX}` : `${API_URL}/${API_PREFIX}`

const API = {
  endpoints: [
    {
      name: API_DS_NAME,
      endpoint,

      // eslint-disable-next-line @typescript-eslint/naming-convention
      custom_header: async (): Promise<{ Authorization: string }> => ({
        Authorization: `${(await AmplifyAuth.currentSession()).getIdToken().getJwtToken()}`,
      }),
    },
  ],
}

export const initializeAmplify = (): void => {
  Amplify.configure({ Auth, API })
}
