// IMPORTS =========================================================================================
let sortBy = require("lodash.sortby");
let values = require("lodash.values");
let Cycle = require("cyclejs");
let {Rx, h} = Cycle;
let Slider = require("./slider");

// EXPORTS =========================================================================================
let View = Cycle.createView(Model => {
  let state$ = Model.get("state$");
  return {
    vtree$: state$.map(items => (
      <div class="sliders">
        <div>
          <button class="btn btn-default add">Add Random</button>
        </div>
        <div>
          {sortBy(values(items), item => item.id).map(item =>
            <Slider id={item.id} value={item.value} color={item.color} key={item.id}/>
          )}
        </div>
      </div>
    )),
  };
});

module.exports = View;