"use client";

type ConfirmDeleteButtonProps = {
  message: string;
};

export function ConfirmDeleteButton({ message }: ConfirmDeleteButtonProps) {
  return (
    <button
      className="text-button danger"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      type="submit"
    >
      삭제
    </button>
  );
}
