import React from "react";

// This is a placeholder component that isn't actually used in the game.
// The HUD is drawn directly on the canvas in the GameLoop.renderHUD method.
// This component is included for completeness and could be used for DOM-based UI elements.

interface HUDProps {
  health: number;
  battery: number;
  ammo: number;
  reserveAmmo: number;
  score: number;
  wave: number;
  activeWeapon: string;
}

const HUD: React.FC<HUDProps> = ({
  health,
  battery,
  ammo,
  reserveAmmo,
  score,
  wave,
  activeWeapon,
}) => {
  return (
    <div
      className="game-hud"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        color: "#39FF14", // Green CRT text color
        fontFamily: "monospace",
        padding: "20px",
        textShadow: "0 0 5px rgba(57, 255, 20, 0.7)",
      }}
    >
      {/* Health Display */}
      <div style={{ position: "absolute", top: "20px", left: "20px" }}>
        <div>HEALTH: {health}</div>
        <div
          style={{
            width: "200px",
            height: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "1px solid #39FF14",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              width: `${health}%`,
              height: "100%",
              backgroundColor:
                health > 50 ? "#39FF14" : health > 25 ? "#FFFF00" : "#FF0000",
            }}
          ></div>
        </div>
      </div>

      {/* Battery Display */}
      <div style={{ position: "absolute", top: "70px", left: "20px" }}>
        <div>BATTERY: {battery}%</div>
        <div
          style={{
            width: "200px",
            height: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            border: "1px solid #39FF14",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              width: `${battery}%`,
              height: "100%",
              backgroundColor: "#FFFF00",
            }}
          ></div>
        </div>
      </div>

      {/* Ammo Display */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          textAlign: "right",
        }}
      >
        <div>{activeWeapon.toUpperCase()}</div>
        <div style={{ fontSize: "24px" }}>
          {ammo} / {reserveAmmo}
        </div>
      </div>

      {/* Score/Wave Display */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          textAlign: "right",
        }}
      >
        <div>SCORE: {score}</div>
        <div>WAVE: {wave}</div>
      </div>

      {/* Mini Map Placeholder */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          right: "20px",
          width: "150px",
          height: "150px",
          border: "1px solid #39FF14",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      ></div>

      {/* Instructions */}
      <div style={{ position: "absolute", bottom: "20px", left: "20px" }}>
        <div>WASD: Move</div>
        <div>MOUSE: Aim/Shoot</div>
        <div>R: Reload</div>
        <div>SPACE: Toggle Flashlight</div>
        <div>1-3: Select Weapon</div>
      </div>
    </div>
  );
};

export default HUD;
