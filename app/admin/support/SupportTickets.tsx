"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";
import {
  createSupportTicketAction,
  deleteSupportTicketAction,
  updateSupportTicketAction,
} from "./actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Ticket = {
  id: string;
  number: string;
  title: string;
  description: string;
  image?: string; // public URL of the attachment, if any
  status: string;
  createdAtLabel: string; // formatted on the server (avoids hydration mismatch)
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  closed: "Closed",
};

export default function SupportTickets({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const toast = useToast();
  const [image, setImage] = useState<string | undefined>(undefined);
  const [fileKey, setFileKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [removed, setRemoved] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detailRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isEdit = editing !== null;

  function openDetail(ticket: Ticket) {
    setSelected(ticket);
    detailRef.current?.showModal();
  }

  function closeDetail() {
    detailRef.current?.close();
  }

  function openModal() {
    formRef.current?.reset();
    setEditing(null);
    setImage(undefined);
    setRemoved(false);
    setFileKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function openEdit(ticket: Ticket) {
    closeDetail();
    setEditing(ticket);
    setImage(ticket.image);
    setRemoved(false);
    setFileKey((k) => k + 1);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function onImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setImage(undefined);
      return;
    }
    setRemoved(false);
    const reader = new FileReader();
    reader.onload = () =>
      setImage(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(undefined);
    setRemoved(true);
    setFileKey((k) => k + 1);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);

    if (editing) {
      formData.set("id", editing.id);
      formData.set("existingImage", editing.image ?? "");
      formData.set("removeImage", removed ? "1" : "");
      const result = await updateSupportTicketAction(formData);
      setPending(false);
      if (result.ok) {
        toast.success(`Ticket ${editing.number} updated.`);
        closeModal();
        router.refresh();
      } else {
        toast.error(result.note);
      }
      return;
    }

    const result = await createSupportTicketAction(formData);
    setPending(false);
    if (result.ok) {
      toast.success(`Ticket ${result.number ?? ""} created.`.replace("  ", " "));
      closeModal();
      router.refresh();
    } else {
      toast.error(result.note);
    }
  }

  async function onDelete(ticket: Ticket) {
    if (
      !window.confirm(
        `Delete ticket ${ticket.number}? This can’t be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    const result = await deleteSupportTicketAction(ticket.id);
    setDeleting(false);
    if (result.ok) {
      toast.success(`Ticket ${ticket.number} deleted.`);
      closeDetail();
      router.refresh();
    } else {
      toast.error(result.note);
    }
  }

  return (
    <>
      <div className="support-head">
        <p className="form-hint">Raise and track internal support tickets.</p>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          Create ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <section className="admin-card">
          <p className="support-empty">No tickets yet.</p>
        </section>
      ) : (
        <div className="support-list">
          {tickets.map((ticket) => (
            <article
              className="admin-card support-ticket"
              key={ticket.number}
              role="button"
              tabIndex={0}
              aria-label={`Open ticket ${ticket.number}: ${ticket.title}`}
              onClick={() => openDetail(ticket)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetail(ticket);
                }
              }}
            >
              {ticket.image ? (
                <div className="support-ticket-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ticket.image}
                    alt={`Attachment for ${ticket.number}`}
                  />
                </div>
              ) : null}
              <div className="support-ticket-body">
                <div className="support-ticket-eyebrow">
                  <span className="support-ticket-eyebrow-left">
                    <span className="support-ticket-number">
                      {ticket.number}
                    </span>
                    <span className={`support-status is-${ticket.status}`}>
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                  </span>
                  <span className="support-ticket-meta">
                    {ticket.createdAtLabel}
                  </span>
                </div>
                <h3 className="support-ticket-title">{ticket.title}</h3>
                {ticket.description ? (
                  <p className="support-ticket-desc">{ticket.description}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <dialog ref={dialogRef} className="support-modal">
        <form
          ref={formRef}
          key={editing?.number ?? "new"}
          className="support-modal-inner admin-form"
          onSubmit={onSubmit}
        >
          <h2>{isEdit ? `Edit ticket ${editing?.number}` : "Create ticket"}</h2>
          <Label variant="bare">
            Title
            <Input
              variant="bare"
              name="title"
              maxLength={140}
              placeholder="Short summary"
              defaultValue={editing?.title ?? ""}
              required
            />
          </Label>
          <Label variant="bare">
            Description
            <Textarea
              variant="bare"
              name="description"
              placeholder="Describe the issue…"
              defaultValue={editing?.description ?? ""}
              required
            />
          </Label>
          <div className="support-field">
            <span className="support-field-label">Image (optional)</span>
            <label className="support-dropzone">
              <input
                key={fileKey}
                name="image"
                className="support-file-input"
                type="file"
                accept="image/*"
                onChange={onImageChange}
              />
              {image ? (
                <span className="support-dropzone-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="support-thumb"
                    src={image}
                    alt="Attachment preview"
                  />
                  <span className="support-dropzone-hint">
                    Click to change image
                  </span>
                </span>
              ) : (
                <span className="support-dropzone-empty">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 15V4m0 0 4 4m-4-4L8 8"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 14v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <strong>Click to upload an image</strong>
                  <small>PNG, JPG or WEBP</small>
                </span>
              )}
            </label>
            {image ? (
              <button
                type="button"
                className="support-remove"
                onClick={removeImage}
              >
                Remove image
              </button>
            ) : null}
          </div>
          <div className="support-modal-actions">
            <button
              type="button"
              className="btn btn-line"
              onClick={closeModal}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? <Spinner /> : null}
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create ticket"}
            </button>
          </div>
        </form>
      </dialog>

      <dialog ref={detailRef} className="support-modal">
        {selected ? (
          <div className="support-modal-inner support-detail">
            <div className="support-ticket-eyebrow">
              <span className="support-ticket-eyebrow-left">
                <span className="support-ticket-number">{selected.number}</span>
                <span className={`support-status is-${selected.status}`}>
                  {STATUS_LABELS[selected.status] ?? selected.status}
                </span>
              </span>
              <span className="support-ticket-meta">
                {selected.createdAtLabel}
              </span>
            </div>
            <h2 className="support-detail-title">{selected.title}</h2>
            {selected.description ? (
              <p className="support-detail-desc">{selected.description}</p>
            ) : null}
            {selected.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="support-detail-image"
                src={selected.image}
                alt={`Attachment for ${selected.number}`}
              />
            ) : null}
            <div className="support-modal-actions support-detail-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => onDelete(selected)}
                disabled={deleting}
                aria-busy={deleting}
              >
                {deleting ? <Spinner /> : null}
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <span className="support-detail-actions-end">
                <button
                  type="button"
                  className="btn btn-line"
                  onClick={() => openEdit(selected)}
                  disabled={deleting}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={closeDetail}
                  disabled={deleting}
                >
                  Close
                </button>
              </span>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
