import React, { useState } from "react";
import Search from "./Search"; // Import Search component
import styles from "./Home.module.css";

const Home = () => {
  const [showSearch, setShowSearch] = useState(false);

  const handleDemoTestClick = () => {
    setShowSearch(true);
  };

  return (
    <center>
      {!showSearch && (
        <div className={styles["contentHome"]}>
          <h1 data-text="Talent Pulse" className={styles["heading"]}>
            Talent Pulse
          </h1>
          <p className={styles["tagline"]}>
            Measure What <span className={styles["taglineSpan"]}></span>
          </p>
          <button
            type="button"
            className={`${styles["demoButton"]} mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105`}
            onClick={handleDemoTestClick}
          >
            Start Demo Test
          </button>
        </div>
      )}
      {showSearch && <Search />}{" "}
      {/* Render Search component when button is clicked */}
    </center>
  );
};

export default Home;
