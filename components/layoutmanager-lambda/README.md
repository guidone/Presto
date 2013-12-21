# LayoutManager Lambda Functions
Funzioni lambda a supporto del LayoutManager come il debounce, blink e loader 

## Installazione
Le funzioni lambda sono funzioni che restituiscono altre funzioni. In questo caso 'wrappano' le funzioni callback collegati agli eventi, quindi restituiscono funzioni che hanno come primo argomento l'oggetto event di Titanium 

Le funzioni lambda possono essere usate singolarmente

	element.addEventListener(
		'click',
		lambdas.debounce(_.bind(that.my_callback,that))
	);

Oppure in automatico configurando il Layout Manager.

L'esempio qua sotto wrappa le funzioni callback con il debounce (impedisce che due click ravvicinati eseguano due volte la funzione di callback) e aggiunge il blink nello schermo dove e' stato fatto il tap.

var lambdas = require('/components/layoutmanager-lambda/layoutmanager-lambda');
layoutManager = new LayoutManager(...);
layoutManager.addLambda('.btnBlink','click',lambdas.debounce);
layoutManager.addLambda('.btnBlink','click',lambdas.blink);

In questo caso tutte le funzioni callback degli eventi *click* agganciate ad elementi con una classe *btnBlink* vengono wrappate con il debounce e con il blink.

	layoutManager.addLambda(
		selector, // .my_class or #my_id or my_type
		eventName,
		lambda_function
	);
	
## Loader
Per creare un semplice loader, aggiungere questo metodo nel controller:

	loader: function(func) {
		var that = this;
		lambda.loader(func,{context: that.layoutManager})();
	}

A questo punto il loader di questo controller trasforma qualunque funzione in un'altra funzione che mostra un loader e lo nasconde quando il repaint del *LayoutManager* e' completato (assumendo che il layoutManager sia in *that.layoutManager*)

Esempio

	that.loader(function() {
		that.my_long_operation();
	});


## Relase notes

- **1.0.6** Aggiunto loader	

