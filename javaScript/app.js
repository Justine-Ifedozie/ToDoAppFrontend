document.querySelectorAll('.edit-btn').forEach(button =>){
    button.addEventListener('click', (e) => {
        const task = e.target.closest('.task');
        const title = task.querySelector('h3').innerText;
        const body = task.querySelector('h3').innerText;
        const priority = task.querySelector('')

        document.getElementById('edit-title').value = title;
        document.getElementById('e')
    })
}