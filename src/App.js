import React, { useEffect, useState } from "react";
import { useShowPopup } from "@vkruglikov/react-telegram-web-app";

const App = () => {
  const showPopup = useShowPopup();
  const [initData, setInitData] = useState("");

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();
    setInitData(JSON.stringify(tg));

    tg.onEvent("mainButtonClicked", function () {
      const dataToSend = { status: "clicked", timestamp: Date.now() };
      tg.sendData(JSON.stringify(dataToSend));
      tg.close();
    });
  }, []);

  const showPopupOnClick = async () => {
    const message =
      "Thanks for using this Telegram Mini App! I hope it helps you create awesome experiences!";
    await showPopup({ title: "Hey!", message });
  };

  const mainButtonClickHandler = () => {
    const tg = window.Telegram.WebApp;
    tg.MainButton.show();
    tg.MainButton.setText("Click Me!");
  };

  return (
    <div className="p-6 font-sans bg-gray-50 min-h-screen flex flex-col items-center">
      <div className="max-w-lg w-full bg-white shadow-md rounded-lg p-6">
        <a
          href="https://github.com/usernein/react-mini-app"
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">Telegram Mini App</h1>
        </a>

        <button
          onClick={showPopupOnClick}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded mb-4 hover:bg-blue-600"
        >
          Show Popup!
        </button>

        <button
          onClick={mainButtonClickHandler}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Show Telegram Main Button
        </button>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Init Data:</h2>
          <p className="mt-2 bg-gray-100 p-3 rounded text-sm break-words">
            {initData}
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;