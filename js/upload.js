import supabase from './supabase-client.js';

const form = document.getElementById('prescriptionForm');
const fileInput = document.getElementById('prescriptionFile');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoader = submitBtn.querySelector('.btn-loader');
const successMessage = document.getElementById('successMessage');

let selectedFile = null;

fileInput.addEventListener('change', handleFileSelect);
removeFileBtn.addEventListener('click', clearFile);

fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = 'var(--color-primary)';
    fileUploadArea.style.background = 'rgba(37, 99, 235, 0.05)';
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.background = '';
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.style.borderColor = '';
    fileUploadArea.style.background = '';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect();
    }
});

function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        clearFile();
        return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a valid file (PDF, PNG, JPG)');
        clearFile();
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    fileUploadArea.classList.add('hidden');
    filePreview.classList.remove('hidden');
}

function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    fileUploadArea.classList.remove('hidden');
    filePreview.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedFile) {
        alert('Please select a file to upload');
        return;
    }

    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');

    try {
        const formData = new FormData(form);
        const patientName = formData.get('patientName');
        const patientEmail = formData.get('patientEmail');
        const patientPhone = formData.get('patientPhone');
        const doctorName = formData.get('doctorName');
        const notes = formData.get('notes') || '';

        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('prescriptions')
            .upload(filePath, selectedFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: urlData } = supabase.storage
            .from('prescriptions')
            .getPublicUrl(filePath);

        const { data: prescriptionData, error: insertError } = await supabase
            .from('prescriptions')
            .insert([
                {
                    patient_name: patientName,
                    patient_email: patientEmail,
                    patient_phone: patientPhone,
                    doctor_name: doctorName,
                    notes: notes,
                    file_url: urlData.publicUrl,
                    file_name: selectedFile.name,
                    file_size: selectedFile.size,
                    status: 'pending'
                }
            ])
            .select();

        if (insertError) {
            throw insertError;
        }

        form.classList.add('hidden');
        successMessage.classList.remove('hidden');

        setTimeout(() => {
            form.classList.remove('hidden');
            successMessage.classList.add('hidden');
            form.reset();
            clearFile();
            submitBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }, 5000);

    } catch (error) {
        console.error('Error uploading prescription:', error);
        alert('Failed to upload prescription. Please try again.');
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
});
