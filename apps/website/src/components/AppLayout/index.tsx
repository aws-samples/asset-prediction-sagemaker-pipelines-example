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

import { FunctionComponent, useMemo } from 'react'
import { BreadcrumbGroup, SideNavigation, AppLayout as NSAppLayout } from 'aws-northstar'
import AppHeader from '../AppHeader'
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation'
import { appvars } from '../../config'

const AppLayout: FunctionComponent = ({ children }) => {
  const menuItems: any[] = useMemo(() => {
    const items = []
    items.push({ text: 'Home', type: SideNavigationItemType.LINK, href: '/' })

    items.push({ type: SideNavigationItemType.DIVIDER })
    items.push({
      text: 'Assets',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.ASSET}`,
    })
    items.push({
      text: 'Training templates',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.TRAINING_TEMPLATE}`,
    })
    items.push({
      text: 'Model training executions',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.MODEL_TRAINING_EXECUTION}`,
    })
    items.push({
      text: 'Model Predictions',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.MODEL_PREDICTION}`,
    })

    items.push({ type: SideNavigationItemType.DIVIDER })

    // items.push({ text: 'My Profile', type: SideNavigationItemType.LINK, href: '/profile' })

    return items
  }, [])

  const sideNavigation = useMemo(() => {
    return <SideNavigation header={{ text: 'Menu', href: '/' }} items={menuItems}></SideNavigation>
  }, [menuItems])

  const breadcrumbs = useMemo(() => <BreadcrumbGroup rootPath='Home' />, [])
  const header = useMemo(() => <AppHeader />, [])

  return (
    <NSAppLayout header={header} navigation={sideNavigation} breadcrumbs={breadcrumbs}>
      {children}
    </NSAppLayout>
  )
}

export default AppLayout
