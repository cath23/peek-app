import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { ContainerHeader } from '@/components/ContainerHeader'
import { PersonRow } from '@/components/ui/PersonRow'
import { Divider } from '@/components/ui/Divider'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StarredSection, type StarredItem } from '@/components/ui/StarredSection'
import { useDmConversationView } from '@/components/views/useDmConversationView'
import { useStarred } from '@/lib/starred'
import { useDebug } from '@/lib/debug'
import { useTopicStore } from '@/lib/topicStore'
import { useLastSelection } from '@/lib/lastSelection'
import { useToast } from '@/lib/toast'
import { dmHasUnread } from '@/data/dmData'
import type { StartTopicResult } from '@/components/CreateTopicDialog'

const DMS = [
  { id: 1, name: 'Alice Johnson',  isUnread: false },
  { id: 2, name: 'Daniel Stanton', isUnread: false },
  { id: 3, name: 'Hallie Pratt',   isUnread: false },
  { id: 4, name: 'Greg Bothman',   isUnread: false },
  { id: 5, name: 'Juan Foley',     isUnread: false },
  { id: 6, name: 'Amie Miles',     isUnread: false },
  { id: 7, name: 'Zack Bright',    isUnread: false },
]

const TEAMS = [
  { id: 10, name: 'Account Management' },
  { id: 11, name: 'Designers' },
  { id: 12, name: 'Engineering' },
  { id: 13, name: 'HR / People Ops' },
  { id: 14, name: 'Product Management' },
  { id: 15, name: 'Sales' },
]

const ALL_ITEMS = [...DMS, ...TEAMS]
const DM_IDS = new Set(DMS.map((d) => d.id))

export function PeoplePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const { createTopicFromDm } = useTopicStore()
  const { dmId: lastDmId, setLastDmId } = useLastSelection()
  const { id: routeId } = useParams<{ id: string }>()
  const [teamsExpanded, setTeamsExpanded] = useState(true)
  const { entries: starredEntries } = useStarred()
  const { state: debug } = useDebug()
  const showUnreads = debug.unreads.people

  // URL is the source of truth — derive selection from routeId.
  const selectedId = routeId ? Number(routeId) : lastDmId ?? null

  const handleSelect = (id: number) => {
    navigate(`/people/${id}`)
  }

  const handleStartTopicFromDm = (dmId: number, dmName: string, seedMessageId: string, data: StartTopicResult) => {
    const { topicId } = createTopicFromDm({
      title: data.title,
      dmId,
      dmName,
      invitees: data.invitees,
      seedMessageId,
    })
    const previousPath = `${location.pathname}${location.search}`
    navigate(`/topics/${topicId}`)
    showToast({
      label: 'Topic created',
      actionLabel: 'Back to conversation',
      onAction: () => navigate(previousPath),
    })
  }

  const starredDmItems: StarredItem[] = starredEntries
    .filter((e) => e.kind === 'dm')
    .map<StarredItem>((e) => ({
      id: e.dmId,
      name: e.name,
      type: 'DM',
      avatarSrc: e.avatarSrc,
      isUnread: showUnreads && dmHasUnread(e.dmId),
    }))
    .sort((a, b) => Number(b.isUnread) - Number(a.isUnread))

  const starredDmIds = new Set(starredDmItems.map((s) => s.id))
  // Sort: unread first when toggle on, otherwise input order. Then drop starred DMs.
  const sortedDms = showUnreads
    ? [...DMS].sort((a, b) => Number(dmHasUnread(b.id)) - Number(dmHasUnread(a.id)))
    : DMS
  const visibleDms = sortedDms.filter((dm) => !starredDmIds.has(dm.id))

  useEffect(() => {
    const numericId = Number(routeId)
    if (routeId && DM_IDS.has(numericId)) {
      setLastDmId(numericId)
    } else if (!routeId && lastDmId != null) {
      // Returning to /people with no id — restore last selection in URL.
      navigate(`/people/${lastDmId}`, { replace: true })
    }
  }, [routeId, lastDmId, navigate, setLastDmId])

  const selectedItem = selectedId ? ALL_ITEMS.find((i) => i.id === selectedId) : null
  const isDm = selectedId != null && DM_IDS.has(selectedId)

  const dmView = useDmConversationView({
    dmId: isDm ? selectedId : null,
    dmName: isDm ? selectedItem?.name : undefined,
    showUnreads,
    onStartTopicFromDm: handleStartTopicFromDm,
  })

  return (
    <AppShell
      leftPanel={
        <div className="flex flex-col h-full">
          <ContainerHeader
            title="People"
            prop1stAction
            prop1stActionTooltip="New conversation"
            prop2ndAction
            prop2ndActionTooltip="Sort by"
          />
          <div className="flex-1 overflow-y-auto pt-4 pb-3 px-3 flex flex-col gap-1">
            <StarredSection
              items={starredDmItems}
              selectedId={selectedId}
              onSelect={handleSelect}
            />

            <Divider className="my-2" />

            {visibleDms.map((dm) => (
              <PersonRow
                key={dm.id}
                name={dm.name}
                type="DM"
                isUnread={showUnreads && dmHasUnread(dm.id)}
                isSelected={selectedId === dm.id}
                onClick={() => handleSelect(dm.id)}
              />
            ))}

            <Divider className="my-2" />

            <SectionHeader
              title="Teams"
              chevron
              isExpanded={teamsExpanded}
              onToggle={() => setTeamsExpanded((v) => !v)}
            />

            {teamsExpanded && TEAMS.map((t) => (
              <PersonRow
                key={t.id}
                name={t.name}
                type="team"
                isSelected={selectedId === t.id}
                onClick={() => handleSelect(t.id)}
              />
            ))}
          </div>
        </div>
      }
      rightPanel={dmView.rightPanel}
      threadPanel={dmView.threadPanel}
    />
  )
}
