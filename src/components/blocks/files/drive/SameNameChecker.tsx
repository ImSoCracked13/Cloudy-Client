import { For, createEffect, createSignal } from 'solid-js';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface SameNameCheckerProps {
    isOpen: boolean;
    onClose: () => void;
    files: File[] | string[]; // Can be File objects or just filenames
    currentFolderId: string | null;
    onUploadComplete?: () => void;
}

export default function SameNameChecker(props: SameNameCheckerProps) {
    const [hasWarned, setHasWarned] = createSignal(false);

    // Show toast warning for duplicate files
    createEffect(() => {
        if (props.files.length > 0 && !hasWarned()) {
            toastService.warning(`File upload prevented: ${props.files.length} file(s) with the same name already exist.`);
            setHasWarned(true);
        }
    });

    // Reset warning state when dialog opens/closes
    createEffect(() => {
        if (!props.isOpen) {
            setHasWarned(false);
        }
    });

    const getFileName = (file: File | string): string => {
        return typeof file === 'string' ? file : file.name;
    };

    return (
        <Dialog isOpen={props.isOpen} onClose={props.onClose} title="Duplicate File Names Detected">
            <div class="p-4">
                <p class="text-sm text-gray-600 mb-4">
                    The following files have the same names as existing files and cannot be uploaded:
                </p>

                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded p-2">
                    <For each={props.files}>
                        {(file) => (
                            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <span class="truncate max-w-[70%]">{getFileName(file)}</span>
                                <span class="text-orange-500 font-medium">Duplicate</span>
                            </div>
                        )}
                    </For>
                </div>

                <div class="mt-4 flex justify-end space-x-2">
                    <Button
                        variant="secondary"
                        onClick={props.onClose}
                        class="!bg-gray-200 hover:!bg-gray-300"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
