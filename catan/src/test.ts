import {Map} from "immutable";


let m: Map<string, number> = Map();

m = m.set("hello", 4);
m = m.set("a", 1);
m = m.set("3", 33);
m = m.set("z", 33);
m = m.set("y", 33);
m = m.set("x", 33);
m = m.set("h", 43);
m = m.set("irjgeoe", 73);

console.log(JSON.stringify([...m.keys()]));
