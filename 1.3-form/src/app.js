let {assoc, identity} = require("ramda")
let {Observable: $} = require("rx")
let Cycle = require("@cycle/core")
let {br, button, div, h1, h2, hr, input, label, makeDOMDriver, p, pre} = require("@cycle/dom")

let {pluck, setState, store, toOverState, toState, view} = require("../../rx.utils")

let {User} = require("./models")
let seeds = require("./seeds")

// main :: {Observable *} -> {Observable *}
let main = function (src) {
  let textFrom = (s) => src.DOM.select(s).events("input")::pluck("target.value").share()
  let clickFrom = (s) => src.DOM.select(s).events("click").map((e) => true).share()

  // INTENTS
  let intents = {
    changeUsername: textFrom("#username"),
    changeEmail: textFrom("#email"),

    createUser: clickFrom("#submit").debounce(100),
  }

  // STATE
  let state = store(seeds, $.merge(
    // Track fields
    intents.changeUsername::toState("form.username"),
    intents.changeEmail::toState("form.email"),

    // Trunk updates
    src.update
  ))

  // TRUNK ACTIONS
  let trunkActions = {
    createUser: state::view("form")
      .sample(intents.createUser)
      .map((input) => User(input))
      .share(),
  }

  // TRUNK UPDATE
  let trunkUpdate = $.merge(
    // Create user
    trunkActions.createUser::toOverState("users", (u) => assoc(u.id, u)),

    // Reset form after valid submit
    trunkActions.createUser.delay(1)::setState("form", seeds.form)
  )

  // SINKS
  return {
    DOM: state.map((state) => {
      let {form} = state
      return div([
        h1("Registration"),
        div(".form-element", [
          label({htmlFor: "username"}, "Username:"),
          br(),
          input("#username", {type: "text", value: form.username, autocomplete: "off"}),
        ]),
        div(".form-element", [
          label({htmlFor: "email"}, "Email:"),
          br(),
          input("#email", {type: "text", value: form.email, autocomplete: "off"}),
        ]),
        button("#submit.form-element", {type: "submit"}, "Register"),
        hr(),
        h2("State SPY"),
        pre(JSON.stringify(state, null, 2)),
      ])
    }),
    
    update: trunkUpdate,
  }
}

Cycle.run(main, {
  update: identity,

  DOM: makeDOMDriver("#app"),
})