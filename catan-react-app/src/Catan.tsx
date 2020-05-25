import * as React from "react";
import axios from "axios";

export const Catan = () => {
  axios.get("/api").then(({data}) => {
    console.log(data);
  });
  return (
      <p>
        Hello!
      </p>
  );
};