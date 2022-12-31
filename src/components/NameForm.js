import React, { useState } from "react";

function NameForm({ myName, setMyName, socket }) {
  const [namee, setNamee] = useState("");
  const [clicked, setClicked] = useState(0);
  function handleSubmit(event) {
    event.preventDefault();
    setMyName(namee);
    setClicked(() => clicked + 1);
    if (namee && !clicked >= 1) {
      socket.emit("name", namee);
    }
  }

  const handleChange = (e) => {
    e.preventDefault();
    setNamee(e.target.value);
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Nickname:
        <input type="text" onChange={handleChange} />
        <button type="submit">submit</button>
      </label>
    </form>
  );
}

export default NameForm;
