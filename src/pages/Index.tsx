import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import VirtualJoystick from '@/components/VirtualJoystick';

interface Position {
  x: number;
  y: number;
}

interface Player {
  id: string;
  position: Position;
  level: number;
  size: number;
  color: string;
  isPlayer: boolean;
}

interface Pixel {
  id: string;
  position: Position;
}

const PixelBallArena = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [player, setPlayer] = useState<Player>({
    id: 'player',
    position: { x: 400, y: 300 },
    level: 1,
    size: 20,
    color: '#FF6B35',
    isPlayer: true
  });
  const [aiPlayers, setAiPlayers] = useState<Player[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const gameLoopRef = useRef<number>();

  // Инициализация игры
  const initializeGame = useCallback(() => {
    // Создаем ИИ игроков
    const aiPlayersData: Player[] = [];
    for (let i = 0; i < 8; i++) {
      aiPlayersData.push({
        id: `ai-${i}`,
        position: {
          x: Math.random() * 2000 - 1000,
          y: Math.random() * 2000 - 1000
        },
        level: Math.floor(Math.random() * 5) + 1,
        size: 15 + Math.floor(Math.random() * 5) + 1,
        color: i % 2 === 0 ? '#5DADE2' : '#2C3E50',
        isPlayer: false
      });
    }
    setAiPlayers(aiPlayersData);

    // Создаем пиксели
    const pixelsData: Pixel[] = [];
    for (let i = 0; i < 200; i++) {
      pixelsData.push({
        id: `pixel-${i}`,
        position: {
          x: Math.random() * 3000 - 1500,
          y: Math.random() * 3000 - 1500
        }
      });
    }
    setPixels(pixelsData);
  }, []);

  // Обработка клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Движение игрока
  const movePlayer = useCallback(() => {
    if (!gameStarted) return;

    setPlayer(prev => {
      let newX = prev.position.x;
      let newY = prev.position.y;
      const speed = 3;

      // Клавиатурное управление
      if (keys.has('w') || keys.has('ц') || keys.has('arrowup')) newY -= speed;
      if (keys.has('s') || keys.has('ы') || keys.has('arrowdown')) newY += speed;
      if (keys.has('a') || keys.has('ф') || keys.has('arrowleft')) newX -= speed;
      if (keys.has('d') || keys.has('в') || keys.has('arrowright')) newX += speed;

      // Джойстик управление
      if (Math.abs(joystickInput.x) > 0.1 || Math.abs(joystickInput.y) > 0.1) {
        newX += joystickInput.x * speed * 1.5;
        newY += joystickInput.y * speed * 1.5;
      }

      return {
        ...prev,
        position: { x: newX, y: newY },
        size: 15 + prev.level * 2
      };
    });
  }, [keys, joystickInput, gameStarted]);

  // Движение ИИ
  const moveAI = useCallback(() => {
    if (!gameStarted) return;

    setAiPlayers(prev => prev.map(ai => {
      // Простое ИИ - движение к ближайшему пикселю
      const nearestPixel = pixels.reduce((nearest, pixel) => {
        const distToCurrent = Math.sqrt(
          Math.pow(pixel.position.x - ai.position.x, 2) + 
          Math.pow(pixel.position.y - ai.position.y, 2)
        );
        const distToNearest = nearest ? Math.sqrt(
          Math.pow(nearest.position.x - ai.position.x, 2) + 
          Math.pow(nearest.position.y - ai.position.y, 2)
        ) : Infinity;
        
        return distToCurrent < distToNearest ? pixel : nearest;
      }, null as Pixel | null);

      if (nearestPixel) {
        const dx = nearestPixel.position.x - ai.position.x;
        const dy = nearestPixel.position.y - ai.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const speed = 1.5;
          return {
            ...ai,
            position: {
              x: ai.position.x + (dx / distance) * speed,
              y: ai.position.y + (dy / distance) * speed
            },
            size: 12 + ai.level * 1.5
          };
        }
      }
      return ai;
    }));
  }, [pixels, gameStarted]);

  // Проверка коллизий
  const checkCollisions = useCallback(() => {
    if (!gameStarted) return;

    // Коллизии с пикселями
    setPixels(prev => {
      const newPixels = prev.filter(pixel => {
        const distanceToPlayer = Math.sqrt(
          Math.pow(pixel.position.x - player.position.x, 2) + 
          Math.pow(pixel.position.y - player.position.y, 2)
        );
        
        if (distanceToPlayer < player.size / 2 + 3) {
          setPlayer(p => ({ ...p, level: p.level + 1 }));
          return false;
        }

        // Проверка коллизий ИИ с пикселями
        const aiCollision = aiPlayers.some(ai => {
          const distanceToAI = Math.sqrt(
            Math.pow(pixel.position.x - ai.position.x, 2) + 
            Math.pow(pixel.position.y - ai.position.y, 2)
          );
          return distanceToAI < ai.size / 2 + 3;
        });

        if (aiCollision) {
          setAiPlayers(prev => prev.map(ai => {
            const distanceToAI = Math.sqrt(
              Math.pow(pixel.position.x - ai.position.x, 2) + 
              Math.pow(pixel.position.y - ai.position.y, 2)
            );
            if (distanceToAI < ai.size / 2 + 3) {
              return { ...ai, level: ai.level + 1 };
            }
            return ai;
          }));
          return false;
        }

        return true;
      });

      // Добавляем новые пиксели если их мало
      if (newPixels.length < 100) {
        for (let i = 0; i < 20; i++) {
          newPixels.push({
            id: `pixel-${Date.now()}-${i}`,
            position: {
              x: Math.random() * 3000 - 1500,
              y: Math.random() * 3000 - 1500
            }
          });
        }
      }

      return newPixels;
    });

    // Коллизии между игроками
    setAiPlayers(prev => prev.filter(ai => {
      const distanceToPlayer = Math.sqrt(
        Math.pow(ai.position.x - player.position.x, 2) + 
        Math.pow(ai.position.y - player.position.y, 2)
      );

      if (distanceToPlayer < (player.size + ai.size) / 2) {
        if (player.level > ai.level) {
          setPlayer(p => ({ ...p, level: p.level + ai.level }));
          return false;
        } else if (ai.level > player.level) {
          // Игрок поглощен - перезапуск
          setPlayer(p => ({ ...p, level: 1, position: { x: 400, y: 300 } }));
        }
      }
      return true;
    }));
  }, [player, aiPlayers, gameStarted]);

  // Обновление камеры
  useEffect(() => {
    if (gameStarted) {
      setCamera({
        x: player.position.x - 400,
        y: player.position.y - 300
      });
    }
  }, [player.position, gameStarted]);

  // Рендеринг игры
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка канваса
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 600);

    // Сетка
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    for (let x = -camera.x % 50; x < 800; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }
    for (let y = -camera.y % 50; y < 600; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // Пиксели
    pixels.forEach(pixel => {
      const screenX = pixel.position.x - camera.x;
      const screenY = pixel.position.y - camera.y;
      
      if (screenX > -10 && screenX < 810 && screenY > -10 && screenY < 610) {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // ИИ игроки
    aiPlayers.forEach(ai => {
      const screenX = ai.position.x - camera.x;
      const screenY = ai.position.y - camera.y;
      
      if (screenX > -ai.size && screenX < 800 + ai.size && screenY > -ai.size && screenY < 600 + ai.size) {
        ctx.fillStyle = ai.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ai.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Уровень ИИ
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(ai.level.toString(), screenX, screenY + 4);
      }
    });

    // Игрок
    const playerScreenX = player.position.x - camera.x;
    const playerScreenY = player.position.y - camera.y;
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(playerScreenX, playerScreenY, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Обводка игрока
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Уровень игрока
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(player.level.toString(), playerScreenX, playerScreenY + 5);
  }, [camera, pixels, aiPlayers, player]);

  // Игровой цикл
  useEffect(() => {
    if (gameStarted) {
      const gameLoop = () => {
        movePlayer();
        moveAI();
        checkCollisions();
        render();
        gameLoopRef.current = requestAnimationFrame(gameLoop);
      };
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, movePlayer, moveAI, checkCollisions, render]);

  const startGame = () => {
    setGameStarted(true);
    initializeGame();
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="p-8 bg-slate-800/90 border-orange-500/30 backdrop-blur-sm">
          <div className="text-center space-y-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent" style={{ fontFamily: 'Orbitron' }}>
              PIXEL BALL ARENA
            </h1>
            <p className="text-xl text-slate-300 max-w-md">
              Управляй шариком, собирай пиксели, поглощай соперников!
            </p>
            <div className="space-y-3 text-slate-400">
              <p><Icon name="Gamepad2" className="inline mr-2" />WASD/стрелки или джойстик для движения</p>
              <p><Icon name="Target" className="inline mr-2" />Собирай золотые пиксели для роста</p>
              <p><Icon name="Zap" className="inline mr-2" />Поглощай шарики меньшего уровня</p>
            </div>
            <Button 
              onClick={startGame}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 text-lg"
            >
              <Icon name="Play" className="mr-2" />
              Начать игру
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Игровая статистика */}
      <div className="absolute top-4 left-4 z-10 space-y-3">
        <Card className="p-4 bg-slate-800/90 border-orange-500/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-sm text-slate-400 mb-1">Уровень</div>
            <div className="text-3xl font-bold text-orange-400" style={{ fontFamily: 'Orbitron' }}>
              {player.level}
            </div>
          </div>
        </Card>
        
        <Card className="p-3 bg-slate-800/90 border-cyan-500/30 backdrop-blur-sm">
          <div className="text-xs text-slate-400 mb-2">Соперники:</div>
          <div className="space-y-1">
            {aiPlayers.slice(0, 5).map(ai => (
              <div key={ai.id} className="flex items-center justify-between text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: ai.color }}
                />
                <span className="text-slate-300">Lvl {ai.level}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Управление */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-3 bg-slate-800/90 border-slate-600/30 backdrop-blur-sm">
          <div className="text-xs text-slate-400 space-y-1">
            <div>WASD - движение</div>
            <div>Цель: стать самым большим!</div>
          </div>
        </Card>
      </div>

      {/* Игровое поле */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 mx-auto my-auto"
        style={{ maxWidth: '100vw', maxHeight: '100vh' }}
      />

      {/* Виртуальный джойстик для мобильных */}
      <VirtualJoystick
        onMove={(x, y) => setJoystickInput({ x, y })}
        onStop={() => setJoystickInput({ x: 0, y: 0 })}
      />
    </div>
  );
};

const Index = () => {
  return <PixelBallArena />;
};

export default Index;