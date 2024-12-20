import React, { useEffect, useState } from "react";
import {
  useHapticFeedback,
  MainButton,
} from "@vkruglikov/react-telegram-web-app";

const ScratchCard = ({ prize, hasPrize, cardId, onPrizeScratched, disabled }) => {
  const [scratchedPercentage, setScratchedPercentage] = useState(0);

  useEffect(() => {
    const canvasElement = document.getElementById(`scratch-${cardId}`);
    const canvasContext = canvasElement.getContext("2d");
    let isDragging = false;
    let scratchedPixels = 0;
    let totalPixels = 0;

    const initializeCanvas = () => {
      const gradient = canvasContext.createLinearGradient(0, 0, 100, 100);
      gradient.addColorStop(0, "#d63031");
      gradient.addColorStop(1, "#fdcb6e");
      canvasContext.fillStyle = gradient;
      canvasContext.fillRect(0, 0, 100, 100);

      // Calculate total pixels
      const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
      totalPixels = imageData.data.length / 4; // Each pixel has 4 values (RGBA)
    };

    const scratch = (x, y) => {
      if (disabled) return; // Disable scratching if it's disabled

      canvasContext.globalCompositeOperation = "destination-out";
      canvasContext.beginPath();
      canvasContext.arc(x, y, 8, 0, 2 * Math.PI);
      canvasContext.fill();

      // Update scratched area detection
      const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const transparentPixels = imageData.data.reduce((acc, value, index) => {
        if ((index + 1) % 4 === 0 && value === 0) acc++; // Count fully transparent pixels
        return acc;
      }, 0);

      scratchedPixels = transparentPixels;

      const currentScratchedPercentage = (scratchedPixels / totalPixels) * 100;
      setScratchedPercentage(currentScratchedPercentage);

      if (currentScratchedPercentage > 50) {
        // Trigger the prize confirmation when 50% is scratched
        onPrizeScratched(prize, hasPrize);
      }
    };

    const getMouseCoordinates = (event) => {
      const rect = canvasElement.getBoundingClientRect();
      const x = (event.pageX || event.touches[0].pageX) - rect.left;
      const y = (event.pageY || event.touches[0].pageY) - rect.top;
      return { x, y };
    };

    const handleMouseDown = (event) => {
      isDragging = true;
      const { x, y } = getMouseCoordinates(event);
      scratch(x, y);
    };

    const handleMouseMove = (event) => {
      if (isDragging) {
        event.preventDefault();
        const { x, y } = getMouseCoordinates(event);
        scratch(x, y);
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseLeave = () => {
      isDragging = false;
    };

    const isTouchDevice = "ontouchstart" in window;

    canvasElement.addEventListener(isTouchDevice ? "touchstart" : "mousedown", handleMouseDown);
    canvasElement.addEventListener(isTouchDevice ? "touchmove" : "mousemove", handleMouseMove);
    canvasElement.addEventListener(isTouchDevice ? "touchend" : "mouseup", handleMouseUp);
    canvasElement.addEventListener("mouseleave", handleMouseLeave);

    initializeCanvas();

    return () => {
      canvasElement.removeEventListener(isTouchDevice ? "touchstart" : "mousedown", handleMouseDown);
      canvasElement.removeEventListener(isTouchDevice ? "touchmove" : "mousemove", handleMouseMove);
      canvasElement.removeEventListener(isTouchDevice ? "touchend" : "mouseup", handleMouseUp);
      canvasElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [cardId, prize, hasPrize, onPrizeScratched, disabled]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          id={`scratch-${cardId}`}
          width="100"
          height="100"
          className="border border-gray-300 rounded-lg"
        ></canvas>
        {scratchedPercentage > 50 && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-80 text-black font-bold rounded-lg">
            {hasPrize ? `Prize: ${prize}` : "No Prize"}
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [cards, setCards] = useState([]);
  const [showMainButton, setShowMainButton] = useState(false);
  const [prizeMessage, setPrizeMessage] = useState("");
  const [firstCardScratched, setFirstCardScratched] = useState(false);

  useEffect(() => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const prizeOptions = ["$50", "$25", "$10"];
    const cardsArray = Array(12)
      .fill(null)
      .map((_, index) => ({
        id: index,
        prize: index < 3 ? prizeOptions[index] : null,
        hasPrize: index < 3,
      }));

    for (let i = cardsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardsArray[i], cardsArray[j]] = [cardsArray[j], cardsArray[i]];
    }

    setCards(cardsArray);
  }, []);

  const handlePrizeScratched = (prize, hasPrize) => {
    if (hasPrize) {
      setPrizeMessage(`You won ${prize}!`);
    } else {
      setPrizeMessage("No prize!");
    }
    if (!firstCardScratched) setFirstCardScratched(true);
    setShowMainButton(true);
  };

  const handleMainButtonClick = () => {
    const tg = window.Telegram.WebApp;
    const dataToSend = { message: prizeMessage, timestamp: Date.now() };
    tg.sendData(JSON.stringify(dataToSend));
    tg.close();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      <header className="text-center my-4">
        <h1 className="text-3xl font-bold text-gray-800">Scratch & Win</h1>
        <p className="text-gray-600">Scratch a card to reveal your prize!</p>
      </header>
      <div className="grid grid-cols-3 gap-4 p-4">
        {cards.map((card) => (
          <ScratchCard
            key={card.id}
            cardId={card.id}
            prize={card.prize}
            hasPrize={card.hasPrize}
            onPrizeScratched={handlePrizeScratched}
            disabled={firstCardScratched}
          />
        ))}
      </div>
      {showMainButton && (
        <div className="my-4">
          <MainButton
            onClick={handleMainButtonClick}
            text="Confirm Prize"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          />
        </div>
      )}
    </div>
  );
};

export default App;
