var imgCounter = 0
var uploadingCounter = 0

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

function openModal() {
	document.getElementById("modal").style.display = "block"
}

function closeModal() {
	document.getElementById("modal").style.display = "none"
}

function createAlbum() {
	var name = document.getElementById("album-input-name").value.toLowerCase(),
		description = document.getElementById("album-input-description").value

	if (!name || !description) {
		alert("Missing info!")
		return false;
	}

	request("POST", "/create-album", JSON.stringify({ "name": name, "description": description }), function (err, res) {
		if(err)	{
			alert(err.error)
			return
		}
		alert("Album created!")
		return
	});

}

function uploadImg() {
	document.getElementById("files").click()
}

function request(type, url, info, callback) {
	var req = new XMLHttpRequest();      
	req.open(type, url, true);
	req.onreadystatechange = function () {
		if (this.readyState == 4) {
			if (this.status >= 200 && this.status < 300) {
			  callback(undefined, JSON.parse(this.responseText))
			  return
			} 
			callback(JSON.parse(this.responseText), undefined)
		}
	};

	if(type == 'POST') {
		req.setRequestHeader("Content-type", "application/json")
		req.send(info)
	} else {
		req.send()
	}
}

function loadImage(event) {
	var showingResults = false
  var output = document.getElementById("result")
  var imgs = event.target.files
  Object.values(imgs).forEach(function (img) {
  	loading();
  	if(img.type.match('image.*')){ 
  		if (!showingResults) {
  			document.getElementById("result").style.display = "flex"
  			document.getElementById("clear").style.display = "inline-block"
  			document.getElementById("upload-imgs").style.display = "block"
  			showingResults = true
  		}
  		var display  = new FileReader()
  		addEvent(display, "loadend", imageLoaded.bind(null, output, imgs.length))
  		display.readAsDataURL(img)
  	} else {
  		alert("You can only upload image files");
  	}
  })
}

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

function imageLoaded(output, length, event) {
	imgCounter++
	var picFile = event.target;
  var div = document.createElement("div")
  div.className = "thumbnail-wrapper"  
  div.innerHTML = "<img id='" + picFile.result.slice(27, 97) + "' class='thumbnail' src='" + picFile.result + "'" +
          "title='preview image'/><i onclick='removeImgElement(event, true)' class='fas fa-trash'></i>"
  output.insertBefore(div,null)
  if (imgCounter==length) {
  	imgCounter = 0
  	loaded()
  }
}

function clearPrevImgs() {
  document.getElementById("result").innerHTML = ""
  document.getElementById("clear").style.display = "none"
  document.getElementById("result").style.display = "none"
  document.getElementById("upload-imgs").style.display = "none"
}

function removeImgElement(event, prevImg) {
	event = crossEvent(event)
	event.target.parentNode.remove()
	if(prevImg) checkOutput()
}

function checkOutput() {
	if(!document.getElementById("result").childNodes.length) clearPrevImgs()
}

function deleteAlbum(event) {
	event.preventDefault()
	let id = event.target.parentElement.id
	
	console.log(id);
	
}

function deleteImg(event) {
	var img = event.target.parentNode.firstElementChild

	if(!img.tagName==="IMG") {
		alert("You only can delete images")
		return
	}

	let imgName = img.src
	let imgPath = imgName.split("https://s3.amazonaws.com/")[1]

	let path = `${window.location.pathname}/delete`
	console.log(path);
	request("POST", path, JSON.stringify({ imgPath }), function (err, res) {
		if(err)	{
			alert(err.error)
			return
		}
		console.log("Image deleted")
		removeImgElement(event)
		return
	});
}

function addEvent (element, type, fn) {
  element.addEventListener(type, function (event) {
    fn(crossEvent(event));
  })
}

function uploadImgs() {
	let sliceCount = 0
	let imgs = []
	let path = `${window.location.pathname}/add`
	let children = document.getElementById("result").children
	
	for(let i = 0; i < children.length; i++) {
		imgs.push(children[i].firstElementChild.src);
	}

	let imgsBatch = imgs.slice(0, 5)

	while (imgsBatch.length && sliceCount < 50) {
		uploadingCounter++
		loading()
		request("POST", path, JSON.stringify({ imgsBatch }), function (err, res) {
			if(err)	{
				alert(err.error)
				return
			}
			console.log("Image added", res.data)
			removeUploadedImg(res.data, document.getElementById("album"))
			uploadingCounter--
			if(!uploadingCounter) {
				clearPrevImgs()
				loaded()
			}
			return
		});
		sliceCount += 5
		imgsBatch = imgs.slice(sliceCount, sliceCount + 5)
	}
}

function removeUploadedImg(imgs, parent) {
	imgs.forEach(img => {		
		var div = document.createElement("div")
  		div.className = "photo"  
  		div.innerHTML = '<img src="' + img.name + '" />\
			<i onclick="deleteImg(event)" class="fas fa-trash"></i>'
		parent.insertBefore(div,null)
		document.getElementById(img.data.slice(27, 97)).remove()
	})
}

function crossEvent(event) {
	if (!event)
		event = window.event
	return event
}



// });
// }
// else
// {
// console.log(“Your browser does not support File API”);
// }
// }

// $(‘#files’).live(“click”, function() {
// $(‘.thumbnail’).parent().remove();
// $(‘result’).hide();
// $(this).val(“”);
// });

// $(‘#clear’).live(“click”, function() {
// $(‘.thumbnail’).parent().remove();
// $(‘#result’).hide();
// $(‘#files’).val(“”);
// $(this).hide();
// });