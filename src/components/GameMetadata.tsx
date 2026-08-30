import clsx from 'clsx'
import React, { ComponentType, SVGProps, useEffect, useState } from 'react'
import { HomeIcon, RectangleStackIcon, TrophyIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@8thday/react'
import { useNavigate } from 'react-router-dom'
import { useGameState } from '../hooks/useGameState'
import {
  blockImage,
  coinImage,
  crystalImage,
  eraAnyBlocker,
  placeBlock,
  towerImage,
  tradingPostGrass,
  treasureChestImage,
  villageImage,
} from '../images'
import { ExplorerBlock } from './ExplorerBlock'
import { MetadataDialog } from './MetadataDialog'
import { ObjectiveCardDisplay } from './ObjectiveCardDisplay'

type MetadataCategory = 'home' | 'player' | 'objectives'
type MetadataIcon = ComponentType<SVGProps<SVGSVGElement>>

interface MetadataButtonProps {
  icon: MetadataIcon
  label: string
  selected?: boolean
  badge?: React.ReactNode
  onClick?(): void
}

const MetadataButton = ({ icon: Icon, label, selected, badge, onClick }: MetadataButtonProps) => {
  const Element = onClick ? 'button' : 'div'

  return (
    <Element
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={clsx(
        'group relative flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-sm transition-all',
        selected ? 'scale-105 bg-slate-900/85 ring-2 ring-white/70' : 'bg-slate-900/50',
        onClick ? 'hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-white/80' : 'cursor-default',
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-7 w-7" aria-hidden="true" />
      {badge}
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block group-focus:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
        {label}
      </span>
    </Element>
  )
}

export const GameMetadata = () => {
  const { gameState } = useGameState()
  const [openCategory, setOpenCategory] = useState<MetadataCategory | null>(null)

  const player = gameState.activePlayer
  const activeInvestigateCard = gameState.currentExplorerCard?.isEraCard
    ? gameState.currentExplorerCard.getInvestigateCard?.(player)
    : null
  const activeCardImage =
    player.mode === 'free-exploring'
      ? placeBlock
      : activeInvestigateCard?.imageUrl ?? gameState.currentExplorerCard?.imageUrl

  useEffect(() => {
    const showObjectives = () => setOpenCategory('objectives')

    gameState.players.forEach((candidate) => candidate.addEventListener('objective-achieved', showObjectives))
    return () =>
      gameState.players.forEach((candidate) => candidate.removeEventListener('objective-achieved', showObjectives))
  }, [gameState.players])

  useEffect(() => {
    const openFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'w') setOpenCategory('objectives')
      if (event.key === 'd') setOpenCategory('player')
    }

    window.addEventListener('keydown', openFromKeyboard)
    return () => window.removeEventListener('keydown', openFromKeyboard)
  }, [])

  return (
    <>
      <nav
        className="pointer-events-none fixed right-2 top-2 z-[60] flex flex-row-reverse gap-2 landscape:bottom-2 landscape:left-2 landscape:right-auto landscape:top-auto landscape:flex-col-reverse"
        aria-label="Game information"
      >
        <div className="pointer-events-auto">
          <MetadataButton
            icon={HomeIcon}
            label="Game Menu"
            selected={openCategory === 'home'}
            onClick={() => setOpenCategory('home')}
          />
        </div>
        <div className="pointer-events-auto">
          <MetadataButton
            icon={RectangleStackIcon}
            label="Active Card"
            badge={
              activeCardImage ? (
                <img
                  src={activeCardImage.href}
                  alt=""
                  className="absolute -bottom-1 -right-1 h-7 w-5 rotate-6 rounded-sm border border-amber-100/70 object-cover shadow"
                  aria-hidden="true"
                />
              ) : null
            }
          />
        </div>
        <div className="pointer-events-auto">
          <MetadataButton
            icon={UserCircleIcon}
            label="Player's Stuff"
            selected={openCategory === 'player'}
            onClick={() => setOpenCategory('player')}
            badge={
              <ExplorerBlock
                color={player.color}
                className="absolute -bottom-1 -right-1 h-6 w-6 drop-shadow"
                aria-hidden="true"
              />
            }
          />
        </div>
        <div className="pointer-events-auto">
          <MetadataButton
            icon={TrophyIcon}
            label="Objectives"
            selected={openCategory === 'objectives'}
            onClick={() => setOpenCategory('objectives')}
            badge={
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-black text-amber-950 shadow">
                {gameState.objectives.length}
              </span>
            }
          />
        </div>
      </nav>

      {openCategory === 'home' && <HomeDialog onClose={() => setOpenCategory(null)} />}
      {openCategory === 'player' && <PlayerStuffDialog onClose={() => setOpenCategory(null)} />}
      {openCategory === 'objectives' && <ObjectivesDialog onClose={() => setOpenCategory(null)} />}
    </>
  )
}

const HomeDialog = ({ onClose }: { onClose(): void }) => {
  const navigate = useNavigate()
  const { resetGame } = useGameState()

  const quitGame = () => {
    resetGame()
    navigate('/')
  }

  return (
    <MetadataDialog title="Game Menu" eyebrow="Where To Next?" onClose={onClose}>
      <div className="flex h-full items-center justify-center overflow-y-auto p-4">
        <div className="w-full max-w-lg rounded-2xl border border-amber-100/20 bg-black/25 p-4 shadow-xl sm:p-6 phone-landscape:p-3">
          <div className="mb-5 text-center phone-landscape:mb-3">
            <HomeIcon className="mx-auto mb-2 h-10 w-10 text-amber-100" aria-hidden="true" />
            <p className="text-sm text-amber-50/75">
              All games are auto-saved. Leave and return without losing progress.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 phone-landscape:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-amber-100/25 bg-[#f5edcf]/95 p-4 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onClick={() => navigate('/')}
            >
              <span className="block text-lg font-black">Navigate Home</span>
              <span className="block text-sm text-slate-600">Game stays saved.</span>
            </button>
            <button
              type="button"
              className="rounded-xl border border-amber-100/25 bg-[#f5edcf]/95 p-4 text-left text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
              onClick={() => navigate('/online/lobby')}
            >
              <span className="block text-lg font-black">Multiplayer Lobby</span>
              <span className="block text-sm text-slate-600">Game stays saved.</span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-red-200/20 pt-4 phone-landscape:mt-3 phone-landscape:pt-3">
            <p className="max-w-xs text-sm text-red-100/75">Permanently deletes this game’s saved data.</p>
            <Button variant="destructive" onClick={quitGame}>
              Quit & Delete Game
            </Button>
          </div>
        </div>
      </div>
    </MetadataDialog>
  )
}

const PlayerStuffDialog = ({ onClose }: { onClose(): void }) => {
  const { gameState } = useGameState()
  const player = gameState.activePlayer
  const hexes = player.board.getFlatHexes()
  const investigateCards = player.investigateCards.keptCards
  const activeInvestigateCard = gameState.currentExplorerCard?.isEraCard
    ? gameState.currentExplorerCard.getInvestigateCard?.(player)
    : null
  const treasureCards = player.treasureCards.keptCards.filter((card) => card.type !== 'jarMultiplier')
  const treasureJars = player.treasureCards.keptCards.filter((card) => card.type === 'jarMultiplier')
  const objectivesClaimed = gameState.objectives.filter(
    (objective) => objective.firstPlayers.includes(player) || objective.secondPlayers.includes(player),
  ).length

  const stats = [
    { label: 'Coins', value: player.coins, image: coinImage },
    { label: 'Villages', value: hexes.filter((hex) => hex.isVillage).length, image: villageImage },
    { label: 'Explored Spaces', value: hexes.filter((hex) => hex.isExplored).length, image: blockImage },
    {
      label: 'Trade Posts',
      value: hexes.filter((hex) => hex.tradingPostValue && hex.isCovered).length,
      image: tradingPostGrass,
    },
    { label: 'Ruins', value: hexes.filter((hex) => hex.isRuin && hex.isCovered).length, image: treasureChestImage },
    { label: 'Towers', value: hexes.filter((hex) => hex.isTower && hex.isCovered).length, image: towerImage },
    { label: 'Objectives', value: objectivesClaimed, image: eraAnyBlocker },
    { label: 'Treasures', value: treasureCards.length + treasureJars.length, image: treasureChestImage },
  ]

  const crystalSpaces = hexes.filter((hex) => hex.crystalValue)
  if (crystalSpaces.length) {
    stats.splice(6, 0, {
      label: 'Crystals',
      value: crystalSpaces.filter((hex) => hex.isCovered).length,
      image: crystalImage,
    })
  }

  return (
    <MetadataDialog title={`${player.id}'s Stuff`} eyebrow="Explorer Ledger" onClose={onClose}>
      <div className="h-full overflow-y-auto p-3 sm:p-5 phone-landscape:p-2">
        <section className="rounded-2xl border border-amber-100/20 bg-black/20 p-3 phone-landscape:p-2">
          <div className="mb-3 flex items-center justify-between gap-3 phone-landscape:mb-1">
            <div className="flex min-w-0 items-center gap-2">
              <ExplorerBlock color={player.color} className="h-9 w-9 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">Most Important</p>
                <h2 className="truncate font-serif text-xl text-amber-50 sm:text-2xl">Investigate Cards</h2>
              </div>
            </div>
            <span className="rounded-full bg-amber-100/10 px-3 py-1 text-xs font-bold text-amber-100/75">
              {investigateCards.length} acquired
            </span>
          </div>

          {investigateCards.length ? (
            <div className="no-scrollbar flex snap-x snap-mandatory justify-start gap-3 overflow-x-auto px-1 pb-1 sm:justify-center">
              {investigateCards.map((card) => (
                <img
                  key={card.id}
                  src={card.imageUrl.href}
                  alt="Investigate card"
                  className={clsx(
                    'h-[clamp(10rem,34dvh,19rem)] w-auto max-w-none snap-center rounded-xl shadow-xl',
                    card === activeInvestigateCard && 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900',
                  )}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-amber-100/20 bg-black/15 px-4 text-center text-amber-50/60">
              Investigate cards acquired during era changes will appear here.
            </div>
          )}
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 phone-landscape:mt-2 phone-landscape:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-h-16 items-center gap-2 rounded-xl border border-amber-100/20 bg-[#f5edcf]/95 px-3 py-2 text-slate-800 shadow phone-landscape:min-h-12 phone-landscape:py-1"
            >
              <img
                src={stat.image.href}
                alt=""
                className="h-9 w-9 shrink-0 object-contain phone-landscape:h-7 phone-landscape:w-7"
              />
              <div className="min-w-0">
                <p className="truncate text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-black tabular-nums text-slate-900 phone-landscape:text-xl">{stat.value}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-3 rounded-2xl border border-amber-100/20 bg-black/20 p-3 phone-landscape:mt-2 phone-landscape:p-2">
          <div className="mb-3 flex items-end justify-between gap-3 phone-landscape:mb-1">
            <h2 className="font-serif text-xl text-amber-50 sm:text-2xl">Treasure Cards</h2>
            <span className="text-sm font-semibold text-amber-100/65">
              {player.treasureCards.getCoinTotal()} coin value
            </span>
          </div>

          {treasureCards.length || treasureJars.length ? (
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
              {treasureJars.length > 0 && (
                <TreasureCardDisplay
                  image={treasureJars[0].imageUrl.href}
                  label={`×${treasureJars.length}`}
                  value={player.treasureCards.getTreasureJarValue()}
                />
              )}
              {treasureCards.map((card) => (
                <TreasureCardDisplay key={card.id} image={card.imageUrl.href} value={card.value(player.board)} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-amber-100/20 p-5 text-center text-amber-50/60">
              No treasure cards acquired yet.
            </p>
          )}
        </section>

        <footer className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/20 p-3">
          <a
            className="rounded-lg px-3 py-2 font-semibold text-amber-50 underline decoration-amber-200/50 underline-offset-4 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.alderac.com/wp-content/uploads/2022/08/TGOME-Rulebook_web.pdf"
          >
            Read Game Instructions
          </a>
          {player.moveHistory.size > 1 && (
            <Button variant="dismissive" onClick={() => player.selectUndo(true)}>
              Reset This Turn
            </Button>
          )}
        </footer>
      </div>
    </MetadataDialog>
  )
}

const TreasureCardDisplay = ({ image, label, value }: { image: string; label?: string; value: number }) => (
  <figure className="relative w-[min(72vw,18rem)] shrink-0 snap-center sm:w-64">
    <img src={image} alt="Treasure card" className="w-full rounded-xl shadow-xl" />
    {label && (
      <figcaption className="absolute left-2 top-2 rounded-full bg-slate-950/85 px-2 py-1 text-sm font-black text-white shadow">
        {label}
      </figcaption>
    )}
    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-slate-950/85 px-2 py-1 text-white shadow">
      <span className="text-lg font-black tabular-nums">{value}</span>
      <img src={coinImage.href} alt="coins" className="h-5 w-5 object-contain" />
    </div>
  </figure>
)

const ObjectivesDialog = ({ onClose }: { onClose(): void }) => {
  const { gameState } = useGameState()

  return (
    <MetadataDialog title="Guild Objectives" onClose={onClose}>
      <div className="grid h-full min-h-0 grid-cols-1 grid-rows-3 gap-1.5 p-2 sm:p-3 phone-landscape:p-2 landscape:grid-cols-3 landscape:grid-rows-1 landscape:gap-2">
        {gameState.objectives.map((objective, position) => (
          <div key={objective.id} className="flex min-h-0 min-w-0 items-center justify-center">
            <ObjectiveCardDisplay
              objective={objective}
              position={position}
              className="h-full max-w-full landscape:h-auto landscape:max-h-full landscape:w-full"
            />
          </div>
        ))}
      </div>
    </MetadataDialog>
  )
}
