import React from "react";
import styles from "./try-button.module.scss";

interface TryButtonProps {
  onClick: () => void;
}

export default function TryButton(
  { onClick }: TryButtonProps = { onClick: () => {} }
) {
  return (
    <button className={styles.tryButton} onClick={onClick}>
      Try for free
    </button>
  );
}
