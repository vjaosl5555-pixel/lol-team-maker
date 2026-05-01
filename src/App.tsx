import { useEffect, useState } from "react";

type Position = "탑" | "정글" | "미드" | "원딜" | "서폿";

type Player = {
  name: string;
  tier: string;
  lp: number;
  mainPosition: Position;
  subPosition: Position;
};

type AssignedPlayer = Player & {
  assignedPosition: Position;
};

const positions: Position[] = ["탑", "정글", "미드", "원딜", "서폿"];

const baseTierScore: Record<string, number> = {
  아이언: 1,
  브론즈: 2,
  실버: 3,
  골드: 4,
  플래티넘: 5,
  에메랄드: 6,
  다이아: 7,
  마스터: 8,
  그랜드마스터: 9,
  챌린저: 10,
};

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<AssignedPlayer[]>([]);
  const [teamB, setTeamB] = useState<AssignedPlayer[]>([]);

  const [name, setName] = useState("");
  const [tier, setTier] = useState("아이언");
  const [lp, setLp] = useState(0);
  const [mainPosition, setMainPosition] = useState<Position>("탑");
  const [subPosition, setSubPosition] = useState<Position>("정글");

  useEffect(() => {
    const savedPlayers = localStorage.getItem("players");

    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("players", JSON.stringify(players));
  }, [players]);

  const getPlayerScore = (player: Player) => {
    const baseScore = baseTierScore[player.tier];

    if (
      player.tier === "마스터" ||
      player.tier === "그랜드마스터" ||
      player.tier === "챌린저"
    ) {
      return baseScore + Math.min(player.lp, 900) / 900;
    }

    return baseScore;
  };

  const getTeamScore = (team: AssignedPlayer[]) => {
    return team.reduce((sum, player) => sum + getPlayerScore(player), 0);
  };

  const hasPosition = (team: AssignedPlayer[], position: Position) => {
    return team.some((player) => player.assignedPosition === position);
  };

  const addPlayer = () => {
    if (!name.trim()) return;

    const newPlayer: Player = {
      name,
      tier,
      lp,
      mainPosition,
      subPosition,
    };

    setPlayers([...players, newPlayer]);
    setName("");
    setLp(0);
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const clearPlayers = () => {
    setPlayers([]);
    setTeamA([]);
    setTeamB([]);
    localStorage.removeItem("players");
  };

  const makeTeams = () => {
    const newTeamA: AssignedPlayer[] = [];
    const newTeamB: AssignedPlayer[] = [];

    const usedPlayers = new Set<string>();

    const sortedPlayers = [...players].sort(
      (a, b) => getPlayerScore(b) - getPlayerScore(a)
    );

    positions.forEach((position) => {
      const candidates = sortedPlayers.filter(
        (player) =>
          !usedPlayers.has(player.name) &&
          (player.mainPosition === position || player.subPosition === position)
      );

      candidates.forEach((player) => {
        if (usedPlayers.has(player.name)) return;

        const canGoA = newTeamA.length < 5 && !hasPosition(newTeamA, position);
        const canGoB = newTeamB.length < 5 && !hasPosition(newTeamB, position);

        if (!canGoA && !canGoB) return;

        const assignedPlayer: AssignedPlayer = {
          ...player,
          assignedPosition: position,
        };

        const scoreA = getTeamScore(newTeamA);
        const scoreB = getTeamScore(newTeamB);

        if (canGoA && canGoB) {
          if (scoreA <= scoreB) {
            newTeamA.push(assignedPlayer);
          } else {
            newTeamB.push(assignedPlayer);
          }
        } else if (canGoA) {
          newTeamA.push(assignedPlayer);
        } else if (canGoB) {
          newTeamB.push(assignedPlayer);
        }

        usedPlayers.add(player.name);
      });
    });

    const remainingPlayers = sortedPlayers.filter(
      (player) => !usedPlayers.has(player.name)
    );

    remainingPlayers.forEach((player) => {
      const possiblePositions = positions.filter(
        (position) =>
          !hasPosition(newTeamA, position) || !hasPosition(newTeamB, position)
      );

      const position = possiblePositions[0] || player.mainPosition;

      const assignedPlayer: AssignedPlayer = {
        ...player,
        assignedPosition: position,
      };

      if (newTeamA.length >= 5) {
        newTeamB.push(assignedPlayer);
      } else if (newTeamB.length >= 5) {
        newTeamA.push(assignedPlayer);
      } else if (getTeamScore(newTeamA) <= getTeamScore(newTeamB)) {
        newTeamA.push(assignedPlayer);
      } else {
        newTeamB.push(assignedPlayer);
      }
    });

    setTeamA(newTeamA);
    setTeamB(newTeamB);
  };

  const renderTeam = (team: AssignedPlayer[]) => {
    return positions.map((position) => {
      const player = team.find((p) => p.assignedPosition === position);

      return (
        <li key={position}>
          {position}:{" "}
          {player
            ? `${player.name} - ${player.tier} ${player.lp}LP`
            : "없음"}
        </li>
      );
    });
  };

  const teamAScore = getTeamScore(teamA).toFixed(2);
  const teamBScore = getTeamScore(teamB).toFixed(2);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h1>롤 내전 팀짜기</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="닉네임 입력"
      />

      <select value={tier} onChange={(e) => setTier(e.target.value)}>
        <option>아이언</option>
        <option>브론즈</option>
        <option>실버</option>
        <option>골드</option>
        <option>플래티넘</option>
        <option>에메랄드</option>
        <option>다이아</option>
        <option>마스터</option>
        <option>그랜드마스터</option>
        <option>챌린저</option>
      </select>

      <input
        type="number"
        value={lp}
        onChange={(e) => setLp(Number(e.target.value))}
        placeholder="LP"
        min={0}
        max={900}
      />

      <select
        value={mainPosition}
        onChange={(e) => setMainPosition(e.target.value as Position)}
      >
        {positions.map((pos) => (
          <option key={pos}>{pos}</option>
        ))}
      </select>

      <select
        value={subPosition}
        onChange={(e) => setSubPosition(e.target.value as Position)}
      >
        {positions.map((pos) => (
          <option key={pos}>{pos}</option>
        ))}
      </select>

      <br />
      <br />

      <button onClick={addPlayer}>추가</button>
      <button onClick={makeTeams}>팀 나누기</button>
      <button onClick={clearPlayers}>전체 초기화</button>

      <h2>참가자 목록</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {players.map((p, i) => (
          <li key={i}>
            {p.name} - {p.tier} {p.lp}LP / 주라인: {p.mainPosition} / 부라인:{" "}
            {p.subPosition}
            <button onClick={() => removePlayer(i)}>삭제</button>
          </li>
        ))}
      </ul>

      <h2>A팀 - 총점 {teamAScore}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>{renderTeam(teamA)}</ul>

      <h2>B팀 - 총점 {teamBScore}</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>{renderTeam(teamB)}</ul>
    </div>
  );
}

export default App;