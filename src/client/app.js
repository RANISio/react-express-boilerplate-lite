import ShoppingList from './components/ShoppingList'
import React, { Component } from 'react'
import css from './app.scss'

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
