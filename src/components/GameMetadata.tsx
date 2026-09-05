import clsx from 'clsx'
import React, { ComponentType, SVGProps, useEffect, useState } from 'react'
import { HomeIcon } from '@heroicons/react/24/outline'
import { Button } from '@8thday/react'
import { useNavigate } from 'react-router-dom'
import type { Objective } from '../game-logic/Objective'
import type { Player } from '../game-logic/GameState'
import type { InvestigateCard } from '../game-logic/Cards'
import { useGameState } from '../hooks/useGameState'
import {
  blockImage,
  coinImage,
  crystalImage,
  eraAnyBlocker,
  explorerMat,
  placeBlock,
  towerImage,
  tradingPostGrass,
  treasureChestImage,
  villageImage,
} from '../images'
import { ExplorerBlock } from './ExplorerBlock'
import { ExplorerMatModal } from './ExplorerMatModal'
import { InvestigateCardDetail } from './InvestigateCardDetail'
import { MetadataDialog } from './MetadataDialog'
import { ObjectiveCardDisplay } from './ObjectiveCardDisplay'

type MetadataCategory = 'active-card' | 'home' | 'player' | 'objectives'
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
        'group relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg backdrop-blur-sm transition-all',
        selected ? 'scale-105 bg-slate-900/85 ring-2 ring-white/70' : 'bg-slate-900/50',
        onClick ? 'hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-white/80' : 'cursor-default',
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="h-8 w-8" aria-hidden="true" />
      {badge}
      <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block group-focus:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
        {label}
      </span>
    </Element>
  )
}

const OBJECTIVE_FAN_POSITIONS = [
  { right: '2%', top: '0%', rotation: '8deg' },
  { right: '8%', top: '18%', rotation: '2deg' },
  { right: '13%', top: '36%', rotation: '-5deg' },
]

const ObjectiveFanButton = ({
  objectives,
  selected,
  onClick,
}: {
  objectives: Objective[]
  selected: boolean
  onClick(): void
}) => (
  <button
    type="button"
    className={clsx(
      'group relative flex h-14 w-14 items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-white/80',
      selected && 'scale-105',
    )}
    aria-label="Objectives"
    title="Objectives"
    aria-expanded={selected}
    onClick={onClick}
  >
    <span className="absolute inset-0" aria-hidden="true">
      {objectives.slice(0, 3).map((objective, position) => (
        <img
          key={objective.id}
          src={objective.imageUrl.href}
          alt=""
          className="absolute w-[84%] rounded-[3%] object-contain transition-transform group-hover:scale-105"
          style={{
            right: OBJECTIVE_FAN_POSITIONS[position].right,
            top: OBJECTIVE_FAN_POSITIONS[position].top,
            zIndex: position + 1,
            rotate: OBJECTIVE_FAN_POSITIONS[position].rotation,
            filter: 'drop-shadow(0 4px 3px rgba(0, 0, 0, 0.95))',
          }}
          draggable={false}
        />
      ))}
    </span>
    <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block group-focus:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
      Objectives
    </span>
  </button>
)

const PlayerStuffButton = ({
  playerName,
  color,
  investigateCards,
  selected,
  onClick,
}: {
  playerName: string
  color: string
  investigateCards: Array<{ id: string; imageUrl: URL }>
  selected: boolean
  onClick(): void
}) => {
  const cards = investigateCards.slice(0, 5)
  const hasCards = cards.length > 0
  const label = `${playerName}'s Stuff`

  return (
    <button
      type="button"
      className={clsx(
        'group relative flex h-14 w-14 items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-white/80',
        selected && 'scale-105',
      )}
      aria-label={label}
      title={label}
      aria-expanded={selected}
      onClick={onClick}
    >
      {hasCards && (
        <span className="absolute inset-0" aria-hidden="true">
          {cards.map((card, position) => {
            const fanPosition = cards.length === 1 ? 0 : (position / (cards.length - 1)) * 2 - 1

            return (
              <img
                key={card.id}
                src={card.imageUrl.href}
                alt=""
                className="absolute bottom-[22%] w-[48%] rounded-[6%] object-contain transition-transform group-hover:scale-105"
                style={{
                  left: `${50 + fanPosition * 22}%`,
                  zIndex: position + 1,
                  rotate: `${fanPosition * 14}deg`,
                  translate: '-50% 0',
                  transformOrigin: '50% 90%',
                  filter: 'drop-shadow(0 3px 2px rgba(0, 0, 0, 0.92))',
                }}
                draggable={false}
              />
            )
          })}
        </span>
      )}

      <img
        src={coinImage.href}
        alt=""
        className={clsx(
          'absolute z-20 object-contain drop-shadow-[0_3px_2px_rgba(0,0,0,0.9)]',
          hasCards ? 'bottom-0 left-0 h-6 w-6' : 'left-[27%] top-0 h-8 w-8',
        )}
        aria-hidden="true"
        draggable={false}
      />
      <ExplorerBlock
        color={color}
        className={clsx(
          'absolute z-22 object-contain drop-shadow-[0_3px_2px_rgba(0,0,0,0.9)]',
          hasCards ? 'bottom-0 left-[31%] h-6 w-6' : 'bottom-0 left-0 h-8 w-8',
        )}
        aria-hidden="true"
        draggable={false}
      />
      <img
        src={villageImage.href}
        alt=""
        className={clsx(
          color,
          'absolute z-21 object-contain drop-shadow-[0_3px_2px_rgba(0,0,0,0.9)]',
          hasCards ? 'bottom-0 right-0 h-7 w-7' : 'bottom-0 right-0 h-9 w-9',
        )}
        aria-hidden="true"
        draggable={false}
      />

      <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block group-focus:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
        {label}
      </span>
    </button>
  )
}

export const GameMetadata = ({ viewedPlayer }: { viewedPlayer: Player }) => {
  const { gameState } = useGameState()
  const [openCategory, setOpenCategory] = useState<MetadataCategory | null>(null)

  const player = viewedPlayer
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
        className="pointer-events-none fixed right-2 top-2 z-60 flex flex-row-reverse gap-3 hover:z-80 focus-within:z-80 landscape:bottom-2 landscape:left-2 landscape:right-auto landscape:top-auto landscape:flex-col-reverse"
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
          <PlayerStuffButton
            playerName={player.id}
            color={player.color}
            investigateCards={player.investigateCards.keptCards}
            selected={openCategory === 'player'}
            onClick={() => setOpenCategory('player')}
          />
        </div>
        <div className="pointer-events-auto">
          <ObjectiveFanButton
            objectives={gameState.objectives}
            selected={openCategory === 'objectives'}
            onClick={() => setOpenCategory('objectives')}
          />
        </div>
        <div className="pointer-events-auto">
          <button
            type="button"
            className="group relative flex h-14 w-14 items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-300"
            aria-label="Active Card"
            title="Active Card"
            aria-expanded={openCategory === 'active-card'}
            onClick={() => setOpenCategory('active-card')}
          >
            <img
              src={(activeCardImage ?? explorerMat).href}
              alt={activeCardImage ? 'Active card' : 'Explorer mat'}
              className="h-full w-full object-contain"
              style={{
                filter:
                  'drop-shadow(0 0 1px #dbeafe) drop-shadow(0 0 4px #3b82f6) drop-shadow(0 6px 5px rgba(0, 0, 0, 0.95))',
              }}
            />
            <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
              Active Card
            </span>
          </button>
        </div>
      </nav>

      {openCategory === 'active-card' && (
        <ExplorerMatModal player={player} onClose={() => setOpenCategory(null)} />
      )}
      {openCategory === 'home' && <HomeDialog onClose={() => setOpenCategory(null)} />}
      {openCategory === 'player' && <PlayerStuffDialog player={player} onClose={() => setOpenCategory(null)} />}
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

          <a
            className="mx-auto mt-4 block w-fit rounded-lg px-3 py-2 text-sm font-semibold text-amber-50 underline decoration-amber-200/50 underline-offset-4 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.alderac.com/wp-content/uploads/2022/08/TGOME-Rulebook_web.pdf"
          >
            Read Game Instructions
          </a>

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

const PlayerStuffDialog = ({ player, onClose }: { player: Player; onClose(): void }) => {
  const { gameState } = useGameState()
  const [detailCard, setDetailCard] = useState<InvestigateCard | null>(null)
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
        <section>
          <h2 className="mb-2 text-center font-serif text-xl text-amber-50 sm:text-2xl phone-landscape:mb-1 phone-landscape:text-lg">
            Investigate Cards
          </h2>

          {investigateCards.length ? (
            <div className="flex min-h-0 w-full items-center justify-center gap-2 sm:gap-3 phone-landscape:gap-2">
              {investigateCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="group flex min-w-0 flex-1 justify-center rounded-[5%] focus:outline-none"
                  onClick={() => setDetailCard(card)}
                  aria-label="Enlarge investigate card"
                >
                  <img
                    src={card.imageUrl.href}
                    alt="Investigate card"
                    className={clsx(
                      'h-auto max-h-[clamp(8rem,34dvh,19rem)] w-full max-w-[18rem] rounded-[5%] object-contain shadow-xl transition group-hover:scale-[1.02] group-focus:scale-[1.02] group-focus:ring-4 group-focus:ring-primary-400 phone-landscape:max-h-[30dvh]',
                      card === activeInvestigateCard && 'ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900',
                    )}
                  />
                </button>
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

        {player.moveHistory.size > 1 && (
          <footer className="mt-3 flex items-center justify-center rounded-2xl border border-white/15 bg-black/20 p-3">
            <Button variant="dismissive" onClick={() => player.selectUndo(true)}>
              Reset This Turn
            </Button>
          </footer>
        )}

        {detailCard && <InvestigateCardDetail card={detailCard} onClose={() => setDetailCard(null)} />}
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
