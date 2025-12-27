import { NextPage } from 'next';
import { useLayoutEffect, useRef, useState } from 'react';

type Tower = number[];
type Move = [number, number];

const MIN_DISKS = 3;
const MAX_DISKS = 7;

const DISK_GRADIENTS: Record<number, string> = {
  1: 'from-red-500 to-red-700 text-white',
  2: 'from-orange-400 to-orange-600 text-gray-900',
  3: 'from-yellow-400 to-yellow-600 text-gray-900',
  4: 'from-green-400 to-green-600 text-white',
  5: 'from-blue-400 to-blue-600 text-white',
  6: 'from-purple-400 to-purple-600 text-white',
  7: 'from-pink-400 to-pink-600 text-white',
};

const DISK_TEXT: Record<number, string> = {
  1: 'text-white',
  2: 'text-black',
  3: 'text-black',
  4: 'text-white',
  5: 'text-white',
  6: 'text-white',
  7: 'text-white',
};

const generateMoves = (
  n: number,
  from: number,
  to: number,
  aux: number,
  result: Move[] = []
): Move[] => {
  if (n === 0) return result;
  generateMoves(n - 1, from, aux, to, result);
  result.push([from, to]);
  generateMoves(n - 1, aux, to, from, result);
  return result;
};

const HomePage: NextPage = () => {
  // Refs
  const diskRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevPositions = useRef<Map<number, DOMRect>>(new Map());
  const autoTimer = useRef<NodeJS.Timeout | null>(null);

  // State
  const [diskCount, setDiskCount] = useState(3);
  const [towers, setTowers] = useState<Tower[]>([[3, 2, 1], [], []]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [shakeTower, setShakeTower] = useState<number | null>(null);

  const [history, setHistory] = useState<Tower[][]>([]);
  const [future, setFuture] = useState<Tower[][]>([]);
  const [autoPlaying, setAutoPlaying] = useState(false);

  const optimalMoves = Math.pow(2, diskCount) - 1;
  const isWin = towers[2].length === diskCount;

  /* ---------------- Animation ---------------- */

  useLayoutEffect(() => {
    diskRefs.current.forEach((el, disk) => {
      const prev = prevPositions.current.get(disk);
      if (!prev) return;

      const next = el.getBoundingClientRect();
      const dx = prev.left - next.left;
      const dy = prev.top - next.top;

      if (dx || dy) {
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
          ],
          { duration: 300, easing: 'cubic-bezier(0.4,0,0.2,1)' }
        );
      }
    });

    prevPositions.current.clear();
  }, [towers]);

  const capturePositions = () => {
    prevPositions.current.clear();
    diskRefs.current.forEach((el, disk) => {
      prevPositions.current.set(disk, el.getBoundingClientRect());
    });
  };

  /* ---------------- Core Logic ---------------- */

  const resetGame = (count = diskCount) => {
    stopAutoSolve();
    setDiskCount(count);
    setTowers([Array.from({ length: count }, (_, i) => count - i), [], []]);
    setMoves(0);
    setSelectedTower(null);
    setShakeTower(null);
    setHistory([]);
    setFuture([]);
  };

  const canDrop = (from: number, to: number) => {
    if (from === to) return false;
    const fromDisk = towers[from]?.at(-1);
    const toDisk = towers[to]?.at(-1);
    return fromDisk && (!toDisk || fromDisk < toDisk);
  };

  const moveDisk = (from: number, to: number) => {
    if (!canDrop(from, to)) {
      setShakeTower(to);
      setTimeout(() => setShakeTower(null), 400);
      return;
    }

    capturePositions();
    setHistory((h) => [...h, towers.map((t) => [...t])]);
    setFuture([]);

    const next = towers.map((t) => [...t]);
    const disk = next[from].pop()!;
    next[to].push(disk);

    setTowers(next);
    setMoves((m) => m + 1);
  };

  const handleTowerClick = (index: number) => {
    if (selectedTower === null) {
      if (towers[index].length) setSelectedTower(index);
    } else {
      moveDisk(selectedTower, index);
      setSelectedTower(null);
    }
  };

  /* ---------------- Undo / Redo ---------------- */

  const undo = () => {
    if (!history.length) return;
    capturePositions();
    setFuture((f) => [towers, ...f]);
    const prev = history.at(-1)!;
    setHistory((h) => h.slice(0, -1));
    setTowers(prev);
    setMoves((m) => Math.max(0, m - 1));
  };

  const redo = () => {
    if (!future.length) return;
    capturePositions();
    setHistory((h) => [...h, towers]);
    const next = future[0];
    setFuture((f) => f.slice(1));
    setTowers(next);
    setMoves((m) => m + 1);
  };

  /* ---------------- Auto Solve ---------------- */

  const stopAutoSolve = () => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    autoTimer.current = null;
    setAutoPlaying(false);
  };

  const startAutoSolve = () => {
    stopAutoSolve();
    const solution = generateMoves(diskCount, 0, 2, 1);
    setAutoPlaying(true);

    const play = (i: number) => {
      if (i >= solution.length) {
        setAutoPlaying(false);
        return;
      }
      autoTimer.current = setTimeout(() => {
        const [from, to] = solution[i];
        moveDisk(from, to);
        play(i + 1);
      }, 500);
    };

    play(0);
  };

  /* ---------------- Keyboard ---------------- */

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '1' && e.key <= '3') handleTowerClick(Number(e.key) - 1);
    if (e.key === 'u') undo();
    if (e.key === 'r') redo();
    if (e.key === 'a') autoPlaying ? stopAutoSolve() : startAutoSolve();
  };

  const isValidTarget = (i: number) =>
    selectedTower !== null && canDrop(selectedTower, i);

  /* ---------------- UI ---------------- */

  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="bg-base-200 flex min-h-screen items-center justify-center p-6 outline-none">
      <div className="card bg-base-100 w-full max-w-5xl shadow-xl">
        <div className="card-body">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">🗼 Towers of Hanoi</h1>

            <div className="flex items-center gap-3">
              <span className="text-sm">Disks</span>
              <input
                type="range"
                min={MIN_DISKS}
                max={MAX_DISKS}
                value={diskCount}
                onChange={(e) => resetGame(Number(e.target.value))}
                className="range range-primary range-sm w-32"
              />
              <span className="font-semibold">{diskCount}</span>
            </div>
          </div>

          <div className="stats border border-dashed border-gray-700 shadow">
            <div className="stat">
              <div className="stat-title">Moves</div>
              <div className="stat-value">{moves}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Optimal</div>
              <div className="stat-value">{optimalMoves}</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-6">
            {towers.map((tower, i) => (
              <div
                key={i}
                onClick={() => handleTowerClick(i)}
                className={`relative flex h-64 cursor-pointer flex-col-reverse items-center transition-all ${
                  shakeTower === i ? 'animate-[shake_0.4s]' : ''
                }`}>
                <div
                  className={`absolute bottom-2 h-full w-2 rounded transition-all ${
                    selectedTower === i
                      ? 'bg-primary shadow-[0_0_12px_theme(colors.primary)]'
                      : isValidTarget(i)
                        ? 'bg-success/70 shadow-[0_0_12px_theme(colors.success)]'
                        : 'bg-base-300'
                  }`}
                />

                {tower.map((disk) => {
                  const lifted = selectedTower === i && disk === tower.at(-1);

                  return (
                    <div
                      key={disk}
                      ref={(el): void => {
                        if (!el) {
                          diskRefs.current.delete(disk);
                          return;
                        }
                        diskRefs.current.set(disk, el);
                      }}
                      className={`rounded-box relative mb-2 h-8 bg-gradient-to-r ${
                        DISK_GRADIENTS[disk]
                      } transition-transform ${
                        lifted ? 'z-10 -translate-y-6 scale-105 shadow-xl' : ''
                      }`}
                      style={{ width: `${disk * 48}px` }}>
                      <span
                        className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold ${DISK_TEXT[disk]}`}>
                        {disk}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="card-actions mt-6 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-x-2">
              <button className="btn" onClick={undo}>
                Undo
              </button>
              <button className="btn" onClick={redo}>
                Redo
              </button>
            </div>
            <div className="flex items-center justify-center gap-x-2">
              <button className="btn btn-secondary" onClick={startAutoSolve}>
                Auto Solve
              </button>
              <button className="btn btn-primary" onClick={() => resetGame()}>
                Reset
              </button>
            </div>
          </div>

          {isWin && (
            <div className="alert alert-success mt-4 justify-center">
              🎉 Solved!
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-6px);
          }
          75% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
