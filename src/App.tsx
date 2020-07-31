import React, { Component } from "react";
import "./styles.css";
import { action, observable } from "mobx";
import { observer } from "mobx-react";
import AndOrMultiSelectInput from "./AndOrMultiSelectInput";

@observer
export default class App extends Component {
  @observable
  filters: string[][] = [["home"], ["big", "bright"]];

  @action.bound
  clearFilters() {
    this.filters = [];
  }

  render() {
    console.log("filters", this.filters);
    return (
      <div className="App">
        <h1>Hello CodeSandbox</h1>
        <h3>Length {this.filters.length}</h3>
        <h2>Start editing to see some magic happen!</h2>
        <AndOrMultiSelectInput values={this.filters} />
        <button onClick={this.clearFilters}>Clear</button>
      </div>
    );
  }
}
