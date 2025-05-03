document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('subjects-table');
  const celebrationDiv = document.getElementById('celebration');

  const showModal = (message, type = 'success') => {
    const modal = document.createElement('div');
    modal.className = `modal fade`;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-${type === 'success' ? 'success' : 'danger'} text-white">
          <div class="modal-header">
            <h5 class="modal-title">${type === 'success' ? 'Success' : 'Error'}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>${message}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    modal.addEventListener('hidden.bs.modal', () => modal.remove());
  };

  const populateTable = (subjects) => {
    tableBody.innerHTML = subjects
      .map((subject) => {
        const progress = Math.round((subject.studiedLessons / subject.totalLessons) * 100) || 0;
        return `
          <tr>
            <td>${subject.subject}</td>
            <td>${subject.totalLessons}</td>
            <td>${subject.studiedLessons}</td>
            <td>
              <img src="/images/${subject.rank.toLowerCase().split('-')[0]}.png" alt="${subject.rank}" width="50" class="me-2">
              ${subject.rank}
            </td>
            <td>
              <div class="progress" style="height: 20px;">
                <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%;"
                  aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                  ${progress}%
                </div>
              </div>
            </td>
            <td>
              <button class="btn btn-primary update-btn" data-subject="${subject.subject}" data-total-lessons="${subject.totalLessons}">Update</button>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const showInputModal = (subject, totalLessons, callback) => {
    const modalHtml = `
      <div class="modal fade" id="inputModal">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Update Studied Lessons</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Total lessons: ${totalLessons}</p>
              <input type="number" class="form-control" id="studiedLessonsInput" placeholder="Enter studied lessons" min="0" max="${totalLessons}">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" id="confirmUpdate">Update</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('inputModal'));
    modal.show();

    document.getElementById('confirmUpdate').addEventListener('click', () => {
      const input = document.getElementById('studiedLessonsInput').value;
      const studiedLessons = parseInt(input, 10);
      if (isNaN(studiedLessons) || studiedLessons < 0 || studiedLessons > totalLessons) {
        showModal('Please enter a valid number within the allowed range.', 'danger');
      } else {
        callback(studiedLessons);
        modal.hide();
        document.getElementById('inputModal').remove();
      }
    });
  };

  tableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('update-btn')) {
      const subject = e.target.getAttribute('data-subject');
      const totalLessons = parseInt(e.target.getAttribute('data-total-lessons'));
      showInputModal(subject, totalLessons, (studiedLessons) => {
        fetch('/api/subjects/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, studiedLessons }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              showModal('Lessons updated successfully!');
              celebrationDiv.classList.remove('d-none');
              setTimeout(() => celebrationDiv.classList.add('d-none'), 3000);
              fetchSubjects();
            } else {
              showModal(data.error || 'Failed to update lessons.', 'danger');
            }
          })
          .catch(() => showModal('Failed to update lessons. Please try again later.', 'danger'));
      });
    }
  });

  const fetchSubjects = () => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((subjects) => populateTable(subjects))
      .catch(() => showModal('Failed to load subjects. Please try again later.', 'danger'));
  };

  fetchSubjects();
});