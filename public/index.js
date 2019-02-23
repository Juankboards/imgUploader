// initial requirements
	if(window.location.pathname === "/") window.location.replace("/albums");



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



// request functions

	// album functions
		function createAlbum(event) {
			event = polyfillEvent(event) //check how to avoid this pollyfill in every event function
			event.preventDefault()
			const  name = event.target.elements["album-name"].value
			const	description = event.target.elements["album-description"].value

			request("POST", "albums/add", { name, description })
				.then(data => {
					closeModal()
					addAlbum(data)
				}).catch(err => {
					alert(err) //should change for an error catcher function
				})
		}

		function deleteAlbum(event) {
			event = polyfillEvent(event)
			event.preventDefault()
			const id = event.target.parentElement.id
			
			request("POST", `albums/${id}/delete`)
				.then(() => {
					document.getElementById(id).remove()
				}).catch(err => {
					alert(err) //should change for an error catcher function
				})
		}

	// image functions
		function uploadImgs() {
			let imgs = Array.from(document.getElementById("result").children).map(child => child.lastElementChild.src)
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
					alert(err)
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
					alert(err)
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
										`<img src='https://via.placeholder.com/350/5F5F5F/F0F0F0?text=No Images Jet' alt='${ album.name } image' />`
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
			showSelectedImgsErrors(errors)
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
			document.getElementById("upload-imgs").style.display = "block"
		}

		function imageLoaded(container, remainingFiles, event) {
			let picFile = event.target;
			let prevImg = createDOMElement({
				type: "div",
				attributes: {
					className: "thumbnail-wrapper" 
				},
				innerHTML: `<i onclick='removeImgElement(event, true)' class='fas fa-trash'></i>` +
										`<img id='${picFile.result.slice(27, 97)}' class='thumbnail' src='${picFile.result}' title='preview image' />`
										
			})
			container.insertBefore(prevImg, null)
			if (!remainingFiles) {
				loaded()
				checkContainer()
			}
		}

		function showSelectedImgsErrors(errors) {
			if(!errors.length) return
			let errorStr = "You tried to upload a wrong type of file:\n"
			errors.forEach(error => {
				errorStr += `--------------------\n` +
										`Name: ${error.name} \n` +
										`Type: ${error.type}\n`
			})
			alert(errorStr)
		}

		function clearPrevImgs() {
			document.getElementById("result").innerHTML = ""
			document.getElementById("clear").style.display = "none"
			document.getElementById("result").style.display = "none"
			document.getElementById("upload-imgs").style.display = "none"
		}

		function removeImgElement(event, prevImg) {
			event = polyfillEvent(event)
			event.target.parentNode.remove()
			if(prevImg) checkContainer()
		}

		function checkContainer(fn) {
			if(!document.getElementById("result").childElementCount) {
				fn()
				clearPrevImgs()
			}
		}

		function removeUploadedImg(img) {				
			document.getElementById(img.data.slice(27, 97)).parentNode.remove()
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