let {identity, merge, prop} = require("ramda")
let Class = require("classnames")
let {Observable} = require("rx")
let Cycle = require("@cycle/core")
let {a, makeDOMDriver} = require("@cycle/dom")
let {makeURLDriver} = require("./drivers")
let {pluck, store, view} = require("./rx.utils.js")
let {isActiveUrl, isActiveRoute} = require("./routes")

// main :: {Observable *} -> {Observable *}
let main = function (src) {
  // CURRENT PAGE
  let page = src.navi
    .sample(src.navi::view("route"))  // remount only when page *type* changes...
    .map(({component}) => merge({
        DOM: Observable.empty(), // affects DOM
      }, component(src))
    ).shareReplay(1)

  // INTENTS
  let intents = {
    redirect: src.DOM.select("a:not([rel=external])")
      .events("click")
      .filter((event) => {
        return !(/:\/\//.test(event.target.attributes.href.value)) // drop links with protocols (as external)
      })
      .do((event) => {
        event.preventDefault()
      })
      .map((event) => event.target.attributes.href.value)
      .share(),
  }

  // NAVI
  let updateNavi = intents.redirect.distinctUntilChanged()

  let navi = updateNavi
    .startWith(window.location.pathname)
    .map((url) => {
      let [route, component] = window.doroute(url)

      let aa = (...args) => {
        let vnode = a(...args)
        let {href, className} = vnode.properties
        vnode.properties.className = Class(className, {active: isActiveUrl(url, href)}) // TODO or rather `isActiveRoute`?
        return vnode
      }

      return {
        url,                           // :: String
        route,                         // :: String
        component,                     // :: {Observable *} -> {Observable *}
        isActiveUrl: isActiveUrl(url), // :: String -> Boolean
        aa,
      }
    })
    .distinctUntilChanged().shareReplay(1)
    .delay(1) // shift to the next tick (navi <- routing: immediate)

  return {
    navi: navi,

    DOM: page.flatMapLatest(prop("DOM")),

    URL: navi::view("url"),
  }
}

Cycle.run(main, {
  navi: identity,

  DOM: makeDOMDriver("#app"),

  URL: makeURLDriver(),
})
