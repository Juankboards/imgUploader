// utils functions
	Element.prototype.remove = function() {
			this.parentElement.removeChild(this);
	}

	function polyfillEvent(event) {
		return (event || window.event)
	}

	function request(type, url, info = {}) {
		return new Promise((resolve, reject) => {
			let req = new XMLHttpRequest();      
			req.open(type, url, true);
			req.onreadystatechange = function () {
				if (this.readyState == 4) {
					if(this.status >= 200 && this.status < 300)
						resolve(JSON.parse(this.responseText).data)
					reject(JSON.parse(this.responseText).error)
				}
			}
			req.withCredentials = true
			if(type == 'POST') {
				req.setRequestHeader("Content-type", "application/json")
				req.send(JSON.stringify(info))
			} else {
				req.send()
			}
		})
	}

	function createDOMElement({ type, attributes, innerHTML }) {
		let element = document.createElement(type)
		element.innerHTML = innerHTML || ""  
		for(let attr in attributes) {
			element[attr] = attributes[attr]
		}
		return element
	}

	function submitForm(event) {
		event = polyfillEvent(event)
		event.preventDefault()
		let form = event.target.parentNode
		let errorContainer = document.getElementById("form-errors")
		validateForm(form, errorContainer)
		if(errorContainer.childElementCount) return 
		const info = formatFormInfo(form)
		const path = formPath(form)
		sendForm(info, path)
	}

	function formPath(form) {
		switch(form.className) {
			case "user":
				let path = form.id==="signup-form"? "signup" : "login"
				return path
			case "album":
				return "albums/add"
		}
	}

	function formatFormInfo(form) {
		switch(form.className) {
			case "user":
				return { email: form.elements["email"].value, password: form.elements["password"].value }
			case "album":
				return { name: form.elements["album"].value, description: form.elements["description"].value }
		}
	}

	function validateForm(form, errorContainer) {
		errorContainer.innerHTML = ""
		Array.from(form.elements).forEach(elm => {
			let message = elm.validationMessage
			if (message) showFormError(`${elm.name[0].toUpperCase()}${elm.name.slice(1)}: ${message}`, errorContainer)
		})
		if(form.elements["repeat password"] && form.elements["password"].value!==form.elements["repeat password"].value) showFormError("Password confirmation should be equal to password", errorContainer)
	}

	function resolveFormSubmit(type, data) {
		switch(type) {
			case "login":
				window.location.pathname = "/albums"
				break
			case "signup":
				Swal.fire({
					type: 'success',
					title: "User created, login with your email",
					showConfirmButton: false,
					timer: 200
				})
				location.reload()
				break
			case "albums/add":
				closeModal()
				addAlbum(data)
				break				
		}
	}

// request functions
	// album functions
		function deleteAlbum(event) {
			event = polyfillEvent(event)
			event.preventDefault()
			const id = event.target.parentElement.id
			
			request("POST", `albums/${id}/delete`)
				.then(() => {
					document.getElementById(id).remove()
				}).catch(err => {
					Swal.fire({type: 'error', title: 'Oops...','text': err.toString()}) //should change for an error catcher function
				})
		}

	// image functions
		function uploadImgs() {
			let imgs = Array.from(document.getElementById("result").children).map(child => {
				waiting(child, child.lastElementChild)
				return child.lastElementChild.lastElementChild.src
			})
			if(!imgs.length) return
			loading()
			uploadImgBatch(imgs)			
		}

		function uploadImgBatch(imgs) {
			let imgsBatch = imgs.splice(0, 5)
			let container = document.getElementById("album")
			if(!imgsBatch.length) return
			request("POST", `${window.location.pathname}/add`, { imgsBatch })
				.then(data => {
					handleUploadedImgs(data, container)
				}).catch(err => {
					Swal.fire({type: 'error', title: 'Oops...','text': err.toString()})
				}).finally(() => {
					checkUploadImgsStatus()
				})
			uploadImgBatch(imgs)
		}

		function checkUploadImgsStatus(remaining) {
			checkContainer(loaded)
		}

		function deleteImg(event) {
			event = polyfillEvent(event)
			const img = event.target.nextElementSibling.src
			request("POST", `${window.location.pathname}/delete`, { img })
				.then(() => {
					removeImgElement(event)
				}).catch(err => {
					Swal.fire({type: 'error', title: 'Oops...','text': err.toString()})
				})
		}

		// session
		function sendForm(data, path) {
			request("POST", path, data)
				.then(data => {
					resolveFormSubmit(path, data)
				}).catch(err => {
					Swal.fire({type: 'error', title: 'Oops...','text': err.toString()})
				})
		}
		function logout() {
			request("GET", `/logout`)
			.then(() => {
				window.location.pathname = "/"
			}).catch(err => {
				Swal.fire({type: 'error', title: 'Oops...','text': err.toString()}) //should change for an error catcher function
			})
		}

//interface functions
	// loading
		function loading() {
			document.getElementById("select-images").disabled = true
			document.getElementById("clear").disabled = true
			document.getElementById("upload-imgs").disabled = true
		}

		function loaded() {
			document.getElementById("select-images").disabled = false
			document.getElementById("clear").disabled = false
			document.getElementById("upload-imgs").disabled = false
		}

		function waiting(container, sibling) {
			let newWaiting = createDOMElement({
				type: "div",
				attributes: {
					className: "spinner waiting",
				}
			})			
			container.insertBefore(newWaiting, sibling)
		}

	// modal
		function openModal() {
			document.getElementById("modal").style.display = "block"
		}

		function closeModal() {
			document.getElementById("modal").style.display = "none"
			document.getElementById("new-album-form").reset()
		}

	// album functions
		function addAlbum(album) {			
			let parent = document.getElementById("albums")
			let newAlbum = createDOMElement({
				type: "a",
				attributes: {
					className: "album",
					id: album._id,
					href: `album/${album._id}`
				},
				innerHTML: `<h2>${ album.name }</h2>` +
										`<i onclick='deleteAlbum(event)' class='fas fa-trash'></i>` +
										`<img src='https://images.homedepot-static.com/productImages/b629ec8f-b170-4973-bdcf-447b80dc447e/svn/platinum-matte-formica-laminate-sheets-009021258512000-64_400_compressed.jpg' alt='${ album.name } image' />`
			})			
			parent.insertBefore(newAlbum, null)
		}

	// image functions
		function openBrowseWindow() {
			document.getElementById("files").click()
		}

		function loadImgs(event) {
			event = polyfillEvent(event)
			let container = document.getElementById("result")
			let { imgs, errors } = filterImgsSelection(event.target.files)
			if(imgs.length) {
				diplayPrevImgs()
				loading();
				readImgs(imgs, container)
			}
			handleActionErrors(errors)
		}

		function filterImgsSelection(imgsSelected) {
			return Object.values(imgsSelected).reduce((results, file) => {				
				if(file.type && file.type.match('image.*')) results.imgs.push(file)
				else results.errors.push({name: file.name, type: file.type})
				return results
			}, { imgs: [], errors: [] })
		}

		function readImgs(imgs, container) {
			if(!imgs.length) return
			let img = imgs.shift()
			let display  = new FileReader()
			display.addEventListener("loadend", imageLoaded.bind(null, container, imgs.length))
			display.readAsDataURL(img)
			readImgs(imgs, container)
		}

		function diplayPrevImgs() {
			document.getElementById("result").style.display = "flex"
			document.getElementById("clear").style.display = "inline-block"
			document.getElementById("upload-imgs").style.display = "inline-block"
		}

		function imageLoaded(container, remainingFiles, event) {
			let picFile = event.target;
			let prevImg = createDOMElement({
				type: "div",
				attributes: {
					className: "thumbnail-wrapper" 
				},
				innerHTML: `<div class='prev-image'><i onclick='removeImgElement(event, true)' class='fas fa-trash trash'></i>` +
										`<img id='${picFile.result.slice(27, 97)}' class='thumbnail' src='${picFile.result}' title='preview image' /></div>`
										
			})
			container.insertBefore(prevImg, null)
			if (!remainingFiles) {
				loaded()
				checkContainer()
			}
		}

		function handleActionErrors(errors) {
			if(!errors.length) return
			let errorStr = "You tried to upload a wrong type of file:\n"
			errors.forEach(error => {
				errorStr += `--------------------\n` +
										`Name: ${error.name} \n` +
										`Type: ${error.type}\n`
			})
			Swal.fire({type: 'error', title: 'Oops...','text': errorStr})
		}

		function clearPrevImgs() {
			document.getElementById("result").innerHTML = ""
			document.getElementById("clear").style.display = "none"
			document.getElementById("result").style.display = "none"
			document.getElementById("upload-imgs").style.display = "none"
		}

		function removeImgElement(event, prevImg) {
			event = polyfillEvent(event)
			if(prevImg) {
				event.target.parentNode.parentNode.remove()
				return checkContainer()
			}
			event.target.parentNode.remove()
		}

		function checkContainer(fn) {
			if(!document.getElementById("result").childElementCount) {
				fn()
				clearPrevImgs()
			}
		}

		function removeUploadedImg(img) {				
			document.getElementById(img.data.slice(27, 97)).parentNode.parentNode.remove()
		}

		function showUploadedImgs(img, container) {
			let newImg = createDOMElement({
				type: "div",
				attributes: {
					className: "photo"  
				},
				innerHTML: `<i onclick='deleteImg(event)' class='fas fa-trash'></i>` + 
										`<img src='${img.name}' />`
										
			})
			container.insertBefore(newImg,null)
		}

		function handleUploadedImgs(imgs, container) {
			if(!imgs.length) return
			let img = imgs.shift()
			removeUploadedImg(img)
			showUploadedImgs(img, container)
			handleUploadedImgs(imgs, container)
		}

		function toggleForm(event) {
			event = polyfillEvent(event)
			let clickedForm = event.target.parentNode.parentNode
			let siblingForm = clickedForm.nextElementSibling || clickedForm.previousElementSibling
			clickedForm.style.display = "none"
			siblingForm.style.display = "block"			
		}

		function inputFocus(event) {
			event = polyfillEvent(event)
			let container = event.target.parentNode
			let containerClass = [...container.className.split(" "), "input-focus"]
			container.className = containerClass.join(" ")
		}

		function inputBlur(event) {
			event = polyfillEvent(event)
			let container = event.target.parentNode
			let containerClass = container.className.split(" ").filter(classStr => {
				if(classStr!=="input-focus") return true
			})			
			container.className = containerClass.join(" ")
		}

		function showFormError(error, errorContainer) {
			let newError = createDOMElement({
				type: "p",
				innerHTML: error
			})	
			errorContainer.insertBefore(newError, null)
		}