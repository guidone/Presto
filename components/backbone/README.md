# Backbone
Framework per la creazione di modelli con connettori Rest, Sqlite

## Installazione
Per installare Backbone

	jake install[backbone]

E nel sorgente	

	var Backbone = require('/components/backbone/backbone');

## Definizione del modello
Per definire un modello e utilizzare ad esempio il sync di sqlite

	var Sync = require('/components/backbone/synch/sqlite').sync;
	var sqliteSync = Sync({
		db_name: 'my_db',
		table_name: 'customer',
		columns: {
			'name': 'string',
			'address': 'string'
		}
	});
	var Customer = Backbone.Model.extend({
		sync: sqliteSync
	});
	var CustomerList = Backbone.Collection.extend({
		model: Customer,
		sync: sqliteSync
	});

	module.exports.model = Customer;
	module.exports.list = CustomerList;

Vengono esportati separatamente il modello e la collection.
Il metodo **sinc** deve essere ridefinito sia nel modello che nella collection.

## Operazioni CRUD
Caricare un record

	var customer = new CustomerModel();
	customer.fetch({where: 'id = 4'});
	customer.set('name','my_name');
	customer.save();

Creare un nuovo record

	var new_customer = new CustomerModel({
		name: 'pippuzzo',
		address: 'via cicciuzzo'	
	});
	new_customer.save();

Eliminare un record

	my_customer.destroy();

## SQLsinc
Parametri da passare al sinc sqlite.
E' possibile specificare per intero la query

	customer.fetch({
		query: 'SELECT * FROM customers WHERE id = 4'
	});
	
Oppure

	customer.fetch({
		where: "name LIKE 'key%'",
		order: 'name ASC',
		limit: '10'
	});

Il parametro *query* ha la precendenza su tutti gli altri

E' possibile specificare in ogni caso i parametri, ad esempio

	customer.fetch({
		where: 'name = ?',
		params: {
			name: 'my_customer_name'
		}
	});

## Views
Il modulo supporta le views: tbd

## supSynch [v.1.0.0]
**N.B. Per eseguire le query libere su SUP viene usato i componente 'sup-query'**
###Definizione del modello
Esempio di definizione del modello backbone utilizzando il supSynch

	var Backbone = require('/components/backbone/backbone');
	var Sync = require('/components/backbone/synch/supSynch').sync;
	var supSync = Sync({
		table_name : "CUST_HEADER",
		supModule : require("it.dsgroup.theSupModule"),
		columns : {
			"PARTNER_GUID" : "string",
			"RAGIONE_SOCIALE" : "string",
			"INDIRIZZO" : "string",
			"CAP" : "string",
			"CITTA" : "string",
			"PROVINCIA" : "string"
			"STATO" : "string"
		}
	});
	
	var Customer = Backbone.Model.extend({
		sync : supSync
	});
	
	var CustomerList = Backbone.Collection.extend({
		model : Customer,
		sync : supSync
	});
	
	module.exports.model = Customer;
	module.exports.list = CustomerList;

Esempio di `fetch()` con where statement a condizione multipla. Le diverse condizioni vengono messe in AND (sup-query non supporta ancora le condizioni in OR)

	customerList.fetch({
			where : [{
				left : 'STATO',
				operator : '=',
				right : 'Italia'
			},{
				left : 'PROVINCIA',
				operator : '=',
				right : 'Milano'
			}]
		});

Esempio di `fetch()` con limit

	customerList.fetch({
			offset	: 0,
			limit	: 10
		});

Esempio di `fetch()` con limit

	customerList.fetch({
			offset	: 0,
			limit	: 10
		});

## Credits
- https://github.com/yukatou/titanium-backbone-test

## Release notes

- **1.1.7** Fix bug sui params
- **1.1.6** Supporto per chiavi guid
- **1.1.3** Supporto per le views
- **1.1.0** Aggiunto options.offset
- **1.0.4** Aggiunti: options.limit, options.params
- **1.0.3** Aggiunto opzione order al fetch