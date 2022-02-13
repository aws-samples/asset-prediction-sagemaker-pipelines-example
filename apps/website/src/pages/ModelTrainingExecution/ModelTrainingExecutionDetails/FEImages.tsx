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

import { FunctionComponent, PropsWithChildren, ReactNode } from 'react'
import ImageGallery from 'react-image-gallery'
import 'react-image-gallery/styles/css/image-gallery.css'

const PLOTS = 'plots'

export const FEImages: FunctionComponent<PropsWithChildren<{ executionId: string }>> = ({ executionId }) => {
  const images = [
    {
      original: `/${PLOTS}/${executionId}/assets-per-class.png`,
      thumbnail: `/${PLOTS}/${executionId}/assets-per-class.png`,
      description: 'Assets per class',
    },
    {
      original: `/${PLOTS}/${executionId}/autocorrelation.png`,
      thumbnail: `/${PLOTS}/${executionId}/autocorrelation.png`,
      description: 'Autocorrelation',
    },
    {
      original: `/${PLOTS}/${executionId}/fft-components.png`,
      thumbnail: `/${PLOTS}/${executionId}/fft-components.png`,
      description: 'FFT components',
    },
    {
      original: `/${PLOTS}/${executionId}/validation-loss-autoencoder.png`,
      thumbnail: `/${PLOTS}/${executionId}/validation-loss-autoencoder.png`,
      description: 'Validation loss (autoencoder)',
    },
    {
      original: `/${PLOTS}/${executionId}/feat_imp_individual.png`,
      thumbnail: `/${PLOTS}/${executionId}/feat_imp_individual.png`,
      description: 'Feature importance (top 20)',
    },
    {
      original: `/${PLOTS}/${executionId}/feat_imp_by_class.png`,
      thumbnail: `/${PLOTS}/${executionId}/feat_imp_by_class.png`,
      description: 'Feature importance (by asset class)',
    },
  ]

  return <ImageGallery items={images} lazyLoad={true} showFullscreenButton={false} />
}
