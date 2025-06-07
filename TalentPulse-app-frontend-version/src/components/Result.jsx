import React from "react";
import styles from "./Result.module.css";

const Result = ({ scorePercentage, rating, marksScored, totalMarks }) => {
  return (
    <div className={`${styles["resultDiv"]}`}>
      <h2 className={styles["resultH"]}>Quiz Results</h2>
      <p className={styles["resultPara"]}>
        Score: <span className={styles["fontBold"]}>{marksScored}</span> out of{" "}
        <span className={styles["fontBold"]}>{totalMarks}</span>
      </p>
      <p className={styles["resultPara"]}>
        Percentage:{" "}
        <span className={styles["fontBold"]}>{scorePercentage}%</span>
      </p>
      <p className={styles["resultPara"]}>
        Rating: <span className={styles["fontBold"]}>{rating}</span>
      </p>
    </div>
  );
};

export default Result;
