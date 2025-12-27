import { NextPage } from 'next';
import { useLayoutEffect, useRef, useState } from 'react';

type Tower = number[];

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

const HomePage: NextPage = () => {
  // Refs
  const diskRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevPositions = useRef<Map<number, DOMRect>>(new Map());

  // States
  const [diskCount, setDiskCount] = useState(3);
  const [towers, setTowers] = useState<Tower[]>([
    Array.from({ length: diskCount }, (_, i) => diskCount - i),
    [],
    [],
  ]);
  const [selectedTower, setSelectedTower] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [shakeTower, setShakeTower] = useState<number | null>(null);

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
          {
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }
        );
      }
    });

    // 🔴 CRITICAL: clear after animating
    prevPositions.current.clear();
  }, [towers]);

  const capturePositions = () => {
    prevPositions.current.clear();
    diskRefs.current.forEach((el, disk) => {
      prevPositions.current.set(disk, el.getBoundingClientRect());
    });
  };

  const resetGame = (count = diskCount) => {
    setTowers([Array.from({ length: count }, (_, i) => count - i), [], []]);
    setMoves(0);
    setSelectedTower(null);
    setShakeTower(null);
  };

  const isWin = towers[2]?.length === diskCount;

  const canDrop = (from: number, to: number) => {
    if (from === to) return false;
    const fromDisk = towers[from]?.at(-1);
    const toDisk = towers[to]?.at(-1);
    return fromDisk && (!toDisk || fromDisk < toDisk);
  };

  const handleTowerClick = (index: number) => {
    if (selectedTower === null) {
      if (towers[index]?.length > 0) setSelectedTower(index);
      return;
    }

    if (canDrop(selectedTower, index)) {
      capturePositions();

      const newTowers = towers.map((t) => [...t]);
      const disk = newTowers[selectedTower].pop()!;
      newTowers[index].push(disk);

      setTowers(newTowers);
      setMoves((m) => m + 1);
    } else {
      setShakeTower(index);
      setTimeout(() => setShakeTower(null), 400);
    }

    setSelectedTower(null);
  };

  const isValidTarget = (target: number) => {
    if (selectedTower === null) return false;
    return canDrop(selectedTower, target);
  };

  return (
    <div className="bg-base-200 flex min-h-screen flex-col items-center justify-center p-6">
      <div className="card bg-base-100 container w-full shadow-xl">
        <div className="card-body">
          <div className="flex flex-col flex-wrap items-center justify-between gap-4 md:flex-row">
            <h1 className="text-center text-3xl font-bold">
              🗼 Towers of Hanoi
            </h1>
            {/* Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Disks</span>
              <input
                type="range"
                min={MIN_DISKS}
                max={MAX_DISKS}
                value={diskCount}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setDiskCount(value);
                  resetGame(value);
                }}
                className="range range-primary range-sm w-32"
              />
              <span className="w-4 text-sm font-semibold">{diskCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {isWin ? (
              <div className="alert alert-success mt-4 justify-center">
                🎉 Solved in {moves} moves!
              </div>
            ) : (
              <p className="text-center text-sm opacity-70">
                Moves: <span className="font-semibold">{moves}</span>
              </p>
            )}
          </div>

          {/* Towers */}
          <div className="mt-8 grid grid-cols-3 gap-6">
            {towers.map((tower: Tower, i) => {
              return (
                <div
                  key={i}
                  onClick={() => handleTowerClick(i)}
                  className={`relative flex h-64 cursor-pointer flex-col-reverse items-center transition-all duration-300 ${shakeTower === i ? 'animate-[shake_0.4s]' : ''} `}>
                  <div
                    className={`absolute bottom-2 h-full w-2 rounded transition-all duration-300 ${
                      selectedTower === i
                        ? 'bg-primary shadow-[0_0_12px_theme(colors.primary)]'
                        : isValidTarget(i)
                          ? 'bg-success/70 shadow-[0_0_12px_theme(colors.success)]'
                          : 'bg-base-300'
                    } `}
                  />

                  {tower.map((disk: number) => {
                    const isSelectedTower = selectedTower === i;
                    const isTopDisk = disk === tower.at(-1);
                    const isLifted = isSelectedTower && isTopDisk;

                    return (
                      <div
                        ref={(el) => {
                          if (el) diskRefs.current.set(disk, el);
                          else diskRefs.current.delete(disk);
                        }}
                        key={disk}
                        className={`rounded-box relative mb-2 h-8 bg-gradient-to-r ${DISK_GRADIENTS[disk]} transition-transform duration-200 ease-out ${isLifted ? 'z-10 -translate-y-6 scale-105 cursor-grabbing shadow-xl' : 'cursor-pointer'} `}
                        style={{ width: `${disk * 48}px` }}>
                        <span
                          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-extrabold drop-shadow ${DISK_TEXT[disk]}`}>
                          {disk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="card-actions mt-6 justify-center">
            <button
              className="btn btn-primary"
              onClick={() => resetGame(diskCount)}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Tailwind keyframes */}
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
