import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { toggleRoom } from "@/app/(app)/meetings/actions";
import { t } from "@/i18n";
import { RoomForm } from "./form";

export default async function RoomsPage() {
  await requireRole("ADMIN");
  const rooms = await db.meetingRoom.findMany({ orderBy: { name: "asc" } });
  const r = t.meetings.roomsAdmin;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{r.title}</h1>
      <RoomForm />
      {rooms.length === 0 ? (
        <p className="card py-8 text-center text-sm text-muted">{r.empty}</p>
      ) : (
        <ul className="card divide-y divide-border p-0">
          {rooms.map((room) => (
            <li key={room.id} className="flex items-center justify-between gap-3 p-4 text-sm">
              <span className={room.active ? "" : "text-muted line-through"}>
                {room.name}{room.capacity && <span className="text-muted"> · {r.capacity}: {room.capacity}</span>}
              </span>
              <form action={toggleRoom}>
                <input type="hidden" name="id" value={room.id} />
                <button className="btn-ghost text-xs">{room.active ? t.common.deactivate : t.common.activate}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
