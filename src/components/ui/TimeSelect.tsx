import { Fragment, useMemo } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";

export default function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(() => {
    const times: { label: string; value: string }[] = [{ label: "--", value: "" }];
    for (let h = 6; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        const date = new Date();
        date.setHours(h, m, 0);
        const val = date.toTimeString().slice(0, 5);
        const label = date.toLocaleTimeString("it-IT", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: val, label });
      }
    }
    return times;
  }, []);

  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative w-[100px] text-sm">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className={clsx(
              "relative w-full cursor-default rounded border bg-white py-1 pl-2 pr-6 text-left shadow-sm",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <span className="block truncate">{selected.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
              <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
              {options.map((opt) => (
                <Listbox.Option
                  key={opt.value}
                  value={opt.value}
                  className={({ active }) =>
                    clsx(
                      "cursor-pointer select-none px-2 py-1",
                      active ? "bg-gray-100" : ""
                    )
                  }
                >
                  {opt.label}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}