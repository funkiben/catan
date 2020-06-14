import {List} from "immutable";

const list = List(["a","b","c","d","d","d"]);

console.log(list.removeIn(List(["b","d", "d"])));