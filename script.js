let mode = '';
let members = [{ name: '', id: '', sec: '' }];

const liveMap = {
    'in-uni': 'out-uni', 'in-dept': 'out-dept', 'in-topic': 'out-topic',
    'in-code': 'out-code', 'in-title': 'out-title', 'in-date': 'out-date',
    'in-tname': 'out-tname', 'in-tdes': 'out-tdes', 'in-team': 'out-team',
    'in-sname': 'render', 'in-sid': 'render', 'in-sec': 'render'
};

function openEditor(selected, icon) {
    mode = selected;
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('editor-page').style.display = 'flex';
    document.getElementById('editor-title').innerText = icon + " " + mode;
    document.getElementById('out-type').innerText = mode;
    if (mode === 'Project Report') {
        document.getElementById('project-fields').style.display = 'block';
        document.getElementById('team-line').style.display = 'block';
        document.getElementById('add-member').style.display = 'block';
    }
    sync();
}

function goHome() { 
    location.reload(); 
}

function addMember() {
    if (members.length < 5) {
        members.push({ name: '', id: '', sec: '' });
        renderMemberInputs();
    }
}

function renderMemberInputs() {
    const container = document.getElementById('student-inputs');
    container.innerHTML = '';
    members.forEach((m, i) => {
        container.innerHTML += `
            <div style="background:#f8fafc; padding:10px; margin-bottom:10px; border-radius:8px;">
                <label>Member ${i+1} Name</label><input type="text" value="${m.name || ''}" oninput="updateM(${i}, 'name', this.value)">
                <div class="row">
                    <div class="input-group">
                        <input type="text" placeholder="ID" value="${m.id || ''}" oninput="updateM(${i}, 'id', this.value)">
                    </div>
                    <div class="input-group">
                        <input type="text" placeholder="Sec" value="${m.sec || ''}" oninput="updateM(${i}, 'sec', this.value)">
                    </div>
                </div>
            </div>`;
    });
}

function updateM(i, f, v) { 
    members[i][f] = v; 
    sync(); 
}

function sync() {
    Object.keys(liveMap).forEach(k => {
        const input = document.getElementById(k);
        if (input && liveMap[k] !== 'render') {
            let value = input.value || input.placeholder || '';
            
            // Format date if it's the date field
            if (k === 'in-date' && input.value) {
                const date = new Date(input.value);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                value = `${day}/${month}/${year}`;
            }
            
            document.getElementById(liveMap[k]).innerText = value;
        }
    });

    // Auto-resize topic text based on length
    const topicEl = document.getElementById('out-topic');
    const topicText = document.getElementById('in-topic').value || 'TOPIC TITLE';
    topicEl.innerText = topicText;
    
    // Dynamic font sizing based on text length
    const textLength = topicText.length;
    if (textLength > 100) {
        topicEl.style.fontSize = '18px';
    } else if (textLength > 80) {
        topicEl.style.fontSize = '20px';
    } else if (textLength > 60) {
        topicEl.style.fontSize = '24px';
    } else if (textLength > 40) {
        topicEl.style.fontSize = '28px';
    } else {
        topicEl.style.fontSize = '32px';
    }

    const mOut = document.getElementById('student-render');
    mOut.innerHTML = '';
    if (mode === 'Project Report') {
        members.forEach(m => {
            if(m.name) mOut.innerHTML += `<div style="margin-bottom:8px"><b>${m.name}</b><br>ID: ${m.id} | Sec: ${m.sec}</div>`;
        });
    } else {
        const n = document.getElementById('in-sname').value || "Your Name";
        const id = document.getElementById('in-sid').value || "ID";
        const s = document.getElementById('in-sec').value || "Section";
        mOut.innerHTML = `<div class="p-name-bold">${n}</div>ID: ${id}<br>Section: ${s}`;
    }
}

// Mobile preview toggle
function togglePreview() {
    const previewArea = document.getElementById('preview-area');
    previewArea.classList.toggle('active');
}

document.querySelectorAll('input').forEach(i => i.addEventListener('input', sync));

document.getElementById('in-logo').addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const outImg = document.getElementById('out-img');
            outImg.src = e.target.result;
            outImg.style.display = 'block';
        };
        reader.readAsDataURL(this.files[0]);
    }
});

// Improved PDF generation for mobile and desktop
async function downloadPDF() {
    // Check if libraries are loaded
    if (!checkLibraries()) {
        return;
    }
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = '⏳ Generating...';
    btn.disabled = true;

    try {
        const el = document.getElementById('cover-page');
        const previewArea = document.getElementById('preview-area');
        
        // If on mobile and preview is not active, show it temporarily
        const isMobile = window.innerWidth <= 768;
        const wasMobilePreviewHidden = isMobile && !previewArea.classList.contains('active');
        if (wasMobilePreviewHidden) {
            previewArea.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, 800));
        }
        
        // Store original styles and attributes
        const originalStyles = {
            transform: el.style.transform,
            width: el.style.width,
            maxWidth: el.style.maxWidth,
            minHeight: el.style.minHeight,
            height: el.style.height,
            padding: el.style.padding,
            position: el.style.position,
            left: el.style.left,
            top: el.style.top
        };
        
        // Force exact A4 dimensions for PDF generation
        el.style.position = 'relative';
        el.style.left = '0';
        el.style.top = '0';
        el.style.transform = 'none';
        el.style.width = '210mm';
        el.style.maxWidth = '210mm';
        el.style.height = '297mm';
        el.style.minHeight = '297mm';
        el.style.padding = '25mm 20mm';
        
        // Ensure all fonts are loaded
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }
        
        // Wait for images to fully load
        const images = el.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve even on error to not block
                setTimeout(resolve, 1000); // Timeout after 1 second
            });
        });
        await Promise.all(imagePromises);
        
        // Additional wait for layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Save scroll position
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        // Scroll element into view
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Starting canvas generation...');
        console.log('Element dimensions:', el.offsetWidth, 'x', el.offsetHeight);
        
        // Use higher quality settings for desktop, optimized for mobile
        const scale = isMobile ? 2 : 3;
        
        // Generate canvas
        const canvas = await html2canvas(el, { 
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            removeContainer: false,
            foreignObjectRendering: false,
            letterRendering: true
        });
        
        console.log('Canvas generated successfully:', canvas.width, 'x', canvas.height);
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
        
        // Restore original styles
        Object.keys(originalStyles).forEach(key => {
            if (originalStyles[key] !== null && originalStyles[key] !== undefined) {
                el.style[key] = originalStyles[key];
            } else {
                el.style[key] = '';
            }
        });
        
        // Hide mobile preview if it was hidden before
        if (wasMobilePreviewHidden) {
            await new Promise(resolve => setTimeout(resolve, 100));
            previewArea.classList.remove('active');
        }
        
        // Convert canvas to high quality JPEG
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        console.log('Creating PDF...');
        
        // Create PDF with exact A4 size
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        // Calculate image dimensions to fit A4 perfectly
        const imgWidth = 210;
        const imgHeight = 297;
        
        // Add image to PDF with exact A4 dimensions
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
        
        // Generate filename with timestamp
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
        const sanitizedMode = mode.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        const fileName = `${sanitizedMode}_${dateStr}_${timeStr}.pdf`;
        
        console.log('Saving PDF as:', fileName);
        
        // Save PDF
        pdf.save(fileName);
        
        // Success feedback
        btn.innerText = '✅ Downloaded!';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2500);
        
        console.log('PDF generation completed successfully!');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Detailed error message for user
        let errorMsg = 'Failed to generate PDF.\n\n';
        
        if (error.message.includes('html2canvas')) {
            errorMsg += 'Issue: Canvas rendering failed\n';
            errorMsg += 'Try: Refresh page and try again';
        } else if (error.message.includes('tainted')) {
            errorMsg += 'Issue: Image security restriction\n';
            errorMsg += 'Try: Use a different logo image';
        } else if (error.message.includes('jsPDF')) {
            errorMsg += 'Issue: PDF creation failed\n';
            errorMsg += 'Try: Refresh page and try again';
        } else {
            errorMsg += 'Issue: Unknown error\n';
            errorMsg += 'Try: Use desktop browser or refresh page';
        }
        
        alert(errorMsg);
        
        btn.innerText = '❌ Failed';
        setTimeout(() => {
            btn.innerText = originalText;
            btn.disabled = false;
        }, 2500);
    }
}

// Initialize date input with today's date
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('in-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        sync();
    }
    
    // Check if html2canvas and jsPDF loaded properly
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas library not loaded');
    }
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded');
    }
});

// Fallback method for browsers that don't support html2canvas well
function isMobileBrowser() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check library availability before attempting PDF generation
function checkLibraries() {
    if (typeof html2canvas === 'undefined') {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return false;
    }
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page and try again.');
        return false;
    }
    return true;
}
