import ShoppingList from './components/ShoppingList'
import React, { Component } from 'react'
import mainCSS from './main.scss'

export default class App extends Component {
  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <ShoppingList name="Ranis" />
      </div>
    );
  }
}
