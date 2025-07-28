import { For, createEffect, createSignal } from 'solid-js';
import Dialog from '../../../widgets/Dialog';
import Button from '../../../widgets/Button';
import toastService from '../../../common/Notification';

interface UploadLimitCheckerProps {
    isOpen: boolean;
    onClose: () => void;
    files: File[];
    currentFolderId: string | null;
    onUploadComplete?: () => void;
}

export default function UploadLimitChecker(props: UploadLimitCheckerProps) {
    const sizeLimit = 25 * 1024 * 1024; // 25MB
    const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB
    const [hasWarned, setHasWarned] = createSignal(false);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Show toast warning exceeding size limit and storage limit
    createEffect(() => {
        if (props.files.length > 0 && !hasWarned()) {
            const oversizedFiles = props.files.filter(file => file.size > sizeLimit);
            if (oversizedFiles.length > 0) {
                toastService.warning(`File upload exceeded the maximum size of ${formatFileSize(sizeLimit)}.`);
                setHasWarned(true);
            }

            const totalSize = props.files.reduce((sum, file) => sum + file.size, 0);
            if (totalSize > storageLimit) {
                toastService.warning(`Storage exceeded the usage limit of ${formatFileSize(storageLimit)}.`);
                setHasWarned(true);
            }
        }
    });

    return (
        <Dialog isOpen={props.isOpen} onClose={props.onClose} title="File Size Limit Exceeded">
            <div class="p-4">
                <p class="text-sm text-gray-600 mb-4">
                    The following files exceed the maximum upload size of {formatFileSize(sizeLimit)} and cannot be uploaded:
                </p>

                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded p-2">
                    <For each={props.files}>
                        {(file) => (
                            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                <span class="truncate max-w-[70%]">{file.name}</span>
                                <span class="text-red-500 font-medium">{formatFileSize(file.size)}</span>
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
                        Close
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
