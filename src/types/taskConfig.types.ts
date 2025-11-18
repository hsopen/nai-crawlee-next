export interface TaskConfig {
  name: string
  createAt: string
  endAt?: string
  lang?: string
  currency?: string
  sitemap: {
    siteMapPath: string[]
    INCLUDE_KEYWORD: string[]
    EXCLUDE_KEYWORD: string[]
  }
  css: {
    base: {
      name: {
        preClick: string[]
        selectors: string[]
        property: string
        extSelector: string
      }
      description: {
        selectors: string[]
      }
      categorys: {
        selectors: string[]
        slice: string
        replaces: string[]
      }
      att1Name: {
        text: string
      }
      att1Values: {
        preClick: string[]
        selector: string
        property: string
        replaces: string[]
      }
      att2Name: {
        text: string
      }
      att2Values: {
        preClick: string[]
        selector: string
        property: string
        replaces: string[]
      }
      att3Name: {
        text: string
      }
      att3Values: {
        preClick: string[]
        selector: string
        property: string
        replaces: string[]
      }
      colorButtons: {
        selector: string
      }
      prices: {
        preClick: string[]
        selectors: string[]
        dpIsDot: boolean
        replaces: string[]
      }
      images: {
        preClick: string[]
        selectors: string[]
        property: string
        param: boolean
        replaces: string[]
      }
    }
    ext: {
      waitingTime: number
      startClick: string[]
    }
  }
  config: {
    headless: boolean
    test: boolean
    navigationTimeoutSecs: number
    maxRequestRetries: number
    minConcurrency: number
    maxConcurrency: number
    requestHandlerTimeoutSecs: number
    maxRequestsPerCrawl: number
    proxyConfiguration: string[]
  }
}
