# LayoutManager

Il layout manager permette di creare ottenere un layout di view partendo da due strutture distinte, la prima specifica il layout e la seconda lo stile.
Il layout viene specificato utilizzando un json e innestanto vari oggetti corrispondenti alla gerarchia di view che si vuole realizzare, lo stile viene specificato tramite regole CSS.

## Giusto per partire
L'uso normale:
	
	var LayoutManager = require('/components/layoutmanager/layoutManager').LayoutManager;
	layoutManager = new LayoutManager({
			debug: true
	});
	layoutManager.addStyle('/custom/styles/base');
	var view = layoutManager.createLayout({
		type: 'view',
		className: 'myclass myclass2',
		childs: [{
			type: 'label',
			text: 'my label'
		}]
	});		
	this.win.add(view);	

## Inizializzazione
Per inizializzare l'oggetto layout:

	layoutManager = new LayoutManager({
		debug: true, // mostra informazioni di debug
		layoutDirectoryPath: '/..',
		stylesDirectoryPath: '/..',
		tags: {
			MY_TAG: 'my_tag_layout.js'
		},
		styles: [
			'my_style_sheet.js'
		]
	});

Parametri:
- **debug**: mostra informazioni di debug su come vengono risolte le regole CSS
- **layoutDirectoryPath**: directory base dei layout, viene usata in tutti i casi in cui un file di layout non viene specificata nessuna directory
- **stylesDirectoryPath**: directory base degli stili, viene usata in tutti i casi in cui un file di stile non viene specificata nessuna directory 
- **tags**: Dizionario con il nome del tag (generalemente in maiuscolo) e il file del corrispondente layout
- **styles**: Array con il percorso dei fogli di stile
- **variables**: Dictionary contenente le variabili che devono essere rimpiazzate all'interno del foglio di style (le variabili sono nella forma {my_variable}, il nome della variabile puo' contenere lettere, numeri e underscore
- **cache**: Abilita la cache degli stili, migliora di molto le prestazioni ma e' sperimentale
- **profiler**: Abilita il profiler per la verifica delle prestazioni
	
## Oggetto layout
Al metodo createLayout puo' essere passato un dictionary con i seguenti elementi:

- **type**: Il tipo di elemento: view, label, imageView, button, etc. In pratica tutti gli elementi di Titanium, scritti in camel case, prima lettera minuscola. Obbligatorio
- **className**: una o piu' classe del foglio di stile, separato da spazio
- **id**: identificativo univoco dell'elemento
- **childs**: array di dictionary che contengono i sotto elementi
- **condition**: booleano o funzione che restituisce un booleano, se presente l'elemento viene inserito soltanto se true, serve per inserire una condizione dinamica per l'inserimento
- **forEach**: array di dictionary oppure una collection di Backbone oppure un oggetto Backbone 

## Tags
Il tag e' una shortcut ad un particolare layout e vengono definiti all'inizializzazione del layout manager.
Possono essere utilizzati direttamente nel metodo *.createLayout()*

	var view = layout.createLayout('MY_TAG','MY_TAG2');

Oppure all'interno di un altro layout utilizzando il type **tag**

	module.exports.layout = {
		type: 'tableView',
		childs: [
			{
				type: 'tag',
				name: 'MY_TAG'
			}
		]
	};
	
Convenzionalmente i nomi dei tag vanno in maiuscolo.
La proprietà name può anche essere una funzione in modo da poter includere tag esterni in maniera condizionale:

	module.exports.layout = {
		type: 'tableView',
		childs: [
			{
				type: 'tag',
				name: function() {
					var model = this.getVariable('my_model');
					return model.isSomething() ? 'A_TAG' : 'ANOTHER_TAG';
				}
			}
		]
	};	

## Layout condizionali
La proprieta' *condition* di ogni oggetto layout permette di decidere a runtime si visualizzare l'elemento o meno. Puo' essere un booleano o una funzione di callback

## Collegamento con DB
Alcune porzioni del layout possono essere collegate con una collection Backbone o un array di dictionary, ad esempio per popolare una tabella con una collection

	module.exports.layout = {
	type: 'tableView',	
	childs: [
		{
			forEach: my_backbone_collection,
			type: 'tableViewRow',
			class: 'rows',
			childs: [...]
		}
		]
	};

Le righe all'interno della tabella verranno replicate tante volte quanti sono gli elementi della collection.

Per valorizzare una proprieta' del foglio di stile o di layout con una proprieta' del db, utilizzare il formato {data.my_backbone_field} all'interno della proprietà, ad esempio

	{
	...
	text: '{data.name}'
	...
	}

Per agganciare un evento a ciascuna delle righe e' sufficiente recuperare gli elementi dal layout manager tramite il nome della classe:

	var rows = layoutManager.getByClass('row')
	_(rows).each(function(row) {
		row.addEventListener('click',function(evt) {
			var my_item = layoutManager
				.getDataFromElement(evt.source);
		};
	});

All'interno del click handler e' possibile recuperare il singolo oggetto della collection che ha generato la riga della tabella tramite il metodo *getDataFromElement()*, prende come parametro l'oggetto che ha generato il click. In alternativa e' possibile usare il metodo events() per collegare in una botta sola più eventi ad elementi diversi.

PS: Non includere tra le proprieta' del layout oggetti complessi come ad esempio una classe Backbone, l'applicazione potrebbe chiudersi senza dare alcuna informazione sul debug (SDK 3.0)

Se nel *forEach* viene specificata una collection Backbone, ad ogni fetch viene aggiornata l'area del layout definita dal forEach (ad esempio le righe di una tabella) in maniera automatica.
Al termine dell'aggiornamento viene lanciato un evento "layout" sull'elemento padre dell'area aggiornata (in questo caso ad esempio la tabella), utile ad esempio per agganciare ai nuovi elementi alcuni eventi

	my_table.addEventListener('layout',function(evt) {
		_(evt.items).each(function(item) {
			item.addEventListener('click',my_click_handler);
		});
	});

Per non dover valorizzare manualmente il campo forEach (potrebbe essere annidato sotto molti livelli), puo' essere utilizzata una funzione anonima che recupera il valore direttamente dalle variabili salvate nel layout manager al momento dell'inizializzazione

	{
		type: 'tableViewRow',
		forEach: function() {
			return this.getVariable('customers');
		}
		...
	}

Molto spesso e' necessario collegare un determinato elemento ad un valore del database per poi poterlo recuperare e fare determinate operazioni, ad esempio modificare la classe o cambiare un valore. 
Gli elementi **id** e **className** di un elemento del layout possono essere delle funzioni anonime, in questo caso basta restituire un valore includendo l'id della collection:

 {
		type: 'tableViewRow',
		forEach: my_backbone,
		childs: [
			{
				type: 'button',
				className: 'my_button',
				text: 'My Button',
				id_product: '{data.id}'
			},
			{
				type: 'textField',
				id: function(layout,data) {
					return 'text_'+data.id;
				}
			}
		]
		...
	}

Ad esempio, per impostare un valore nella textfield alla pressione del bottone:
	
	// questo attacca l'evento a tutte le classi .my_button
	layoutManager.events({
		'.my_button': {
			'click': function(evt) {
				// source e' l'elemento da cui proviene il click
				var id = evt.source.id_product;
				// il contesto e' il layout manager
				var textfield = this.getById('text_'+id);
				textfield.value = 'my_value';
			}
		}
	}); 

Oltre metodo *.events()* può essere usato il metodo *.live()*, con gli stessi parametri, con la differenza che gli eventi vengono riagganciati al layout quando l'interfaccia viene ridisegnata in seguito al cambiamento dovuto all'oggetto specificato nel **forEach**.
**Attenzione!** Il metodo e' time consuming, quindi non bisogna esagerare nell'agganciare un numero elevato di metodi, in generale, su eventi semplici come il click e' meglio considerare l'event delegation. Inoltre non funziona a seguito di cambiamenti con metodi tipo *.addClass()*, *.removeClass()*, etc.

## Funzioni di callback
Tutte le funzioni di callback, nei fogli di stile e di layout hanno la forma:

In layout.js	

	module.exports.layout = {
		forEach: my_collection,
		type: 'label',
		className: 'my_label',
		text: function(layout,data) {
			return data.text;
		}
	}

In style.js

	module.exports.style = {
		'.my_label': {
			height: '16dp',
			width: function(style,data) {
				var that = this; // I'm the layout manager
				style.height; // == '16dp'
				return '10dp';
			}
		}
	}

Il contesto e' sempre il layout manager, il primo argomento e' l'oggetto di stile o di layout in cui la funzione e' definita, il secondo argomento e' il record corrente dell'iterazione di un forEach, dunque un dictionary o un model Backbone.

## Organizzare il foglio di stile
Il foglio di stile deve essere organizzato tenendo conto che:

- in ogni layout ci possono essere piu' elementi dello stesso *type* (es. label) ma ogni elemento appartiene ad un solo tipo
- ogni elemento puo' avere una o piu' classi (separati da spazio nella proprieta' *className*)
- per ogni layout ci puo' essere un solo elemento con lo un determinano *id* (e' dunque unico)

tbc	
	
## Orientamento
Il layout manager gestisce automaticamente l'orientamento: all'interno di una regola CSS dello style sheet i dictionary

- *portrait*: vengono applicati soltanto se il devide e' dritto
- *landscape*: vengono applicati soltanto se il device e' ruotato

Es.

	'label.Name': {
		landscape: {
			height: '10dp'
		},
		portrait: {
			height: '20dp'
		}
	}

## Variabili
E' possibile specificare delle variabili in fase di creazione dell'oggetto layout, ad es.

	layoutManager = new LayoutManager({
		variables: {
			'BACKGROUND': '#00ff00',
			'BASE_PATH': 'http://my_server/'
		}	
	};
	
Nel foglio di stile

	{
	..
	backgroundColor: '{BACKGROUND}',
	url: '{BASE_PATH}/image.png'
	}

Se la variabile non viene trovata e' sostituita con una stringa nulla

## Modifica del layout
Per ottenere gli elementi inseriti in un layout

	// restituisce l'elemento con un determinato id
	layoutManager.getById(id)
	// restituisce tutti gli elementi con una determinata classe
	layoutManager.getByClass(className)

Per modificare gli elementi utilizzando le classi:

	layoutManager.setClass(element,classNames);
	layoutManager.addClass(element,className);
	layoutManager.removeClass(element,className);
	layoutManager.hasClass(element,className);

## Eventi
E' possibile aggiungere elementi a-la-jQuery, passando un dizionario di selettori e i relativi eventi da agganciare:

	layoutManager.events({
		'#my_id': {
			'click': function() {
				// my click handler
			}
		},
		'.my_buttons': {
			'click': function() {
				// my click handler
			}
		}
	});

Utilizzare la *_.bind()* di underscore per impostare il contesto in cui le funzioni vengono eseguite.
Tramite il metodo **query(my_selector)** è possibile ottenere tutti gli elementi che corrispondono ad un determinato selettore, attualmente vengono correttamente interpretati solo: .mia_classe e #mio_id.

## Estensione

Per la creazione del layout, il componente internamente ha un dizionario che mappa la proprietà "type" ad una stringa che rappresenta un metodo factory (es. "view": "createView")
o ad un oggetto che contiene, oltre al metodo, anche lo "scope" (es. "popover": {method: 'createPopover', scope: Ti.UI.iPad}).
Questa mappa è estendibile a runtime tramite il metodo di classe "extendTypeMap", es.:

	LayoutManager.extendTypeMap({
	    iOS_toolbar: {
	    	method: 'createToolbar',
	    	scope: Ti.UI.iPhone
	    }
	});

Alla proprietà 'scope' è possibile passare, invece che un oggetto factory (come Ti.UI.iPhone), una path ad un componente custom, es.:

LayoutManager.extendTypeMap({
    extImageView : {
        method : 'createExtImageView',
        scope : '/components/extImageView/extImageView'
    }
});

Ovviamente il componente deve esporre il metodo factory dichiarato nel parametro 'method'.

## Events
L'oggetto LayoutManager supporta gli eventi utilizzando l'interfaccia di Backbone

	layoutManager.on('repaint',function() {
		// do something
	});

Attualmente gli eventi supportati sono

- **repaint**: Eseguito quando una porzione di layout viene ridisegnata in seguito ad una modifica di una collection Backbone nella proprietà forEach
- **complete**: Eseguito al termine di una qualunque operazione di generazione di layout  

## Release notes

- **1.3.19** Fix data forEach dentro callback condition()
- **1.3.18** Aggiunto evento complete
- **1.3.15** repaint on Backbone model
- **1.3.14** Fix expandId
- **1.3.11** Fix removeElement()
- **1.3.10** Aggiunti metodi getParent(), removeElement() e removeByClass()
- **1.3.9** setVariables fix
- **1.3.8** Oggetto LayoutManager supporta gli event
- **1.3.7** Cleanup logs
- **1.3.6** Cleanup logs
- **1.3.5** Supporto per funzioni lambda, metodo .is(), .addLambda()
- **1.3.1** Supporto cache degli stili
- **1.2.7** Supporto profiler
- **1.2.2** supporto per componente backbone-more, supporto proprieta' forEachMore
- **1.2.1** Fix
- **1.2.0** aggiunto metodo .live() e il type 'tag'
- **1.1.13** aggiunto il metodo di classe extendTypeMap; 'scope' adesso può anche essere un path ad un componente;
- **1.1.12** aggiunto metodo getStyle, forEach ora supporta anche il singolo modello Backbone, addClass ora supporta le classi che contengono le keyword speciali portrait/landscape, pulizia log
- **1.1.11** createLayout può restituire una singola view anziché un'array
- **1.1.10** addClass,removeClass,hasClass accettano anche l'id stringa dell'oggetto a cui applicare/rimuovere la classe
- **1.1.9** id e className possono essere funzioni anonime valorizzate con l'elemento della collection
- **1.1.7** Aggiunto metodo query() e events()
- **1.1.5** Aggiunto metodo clear e setVariables 
- **1.1.4** Aggiunte le variabili tipo {data.my_backbone_field}
- **1.1.3** Supporto per rightNavButton e leftNavButton assieme a childs, rimozione file://localhost dai require
- **1.1.1** L'opzione forEach puo' essere anche una function, eseguita nel contesto del layout manager, aggiunto metodo getVariable()
- **1.1.0** Su fetch della collection Backbone viene aggiornata la rispettiva porzione di layout generata dal forEach con quella collection


	
	
	